import {
  useCreateBatch,
  useGetBatches,
  useGetStaffAchievements,
} from "api/query.ts";
import Achievement from "components/staff/Achievement.tsx";

import "assets/css/staff.css";
import AchievementNavigationBar, {
  getDefaultNav,
} from "components/achievements/AchievementNavigationBar.tsx";
import Button from "components/inputs/Button.tsx";
import AchievementCreation from "components/staff/AchievementCreation.tsx";
import { SessionContext } from "contexts/SessionContext.ts";
import {
  useDispatchStateContext,
  useStateContext,
} from "contexts/StateContext.ts";
import React, { useContext, useState } from "react";
import { getSortedAchievements } from "util/achievementSorting.ts";
import { useAuthEnsurer } from "util/auth.ts";
import { Helmet } from "react-helmet";
import ViewSwitcher from "components/common/ViewSwitcher.tsx";
import { EventContext } from "contexts/EventContext.ts";
import { AchievementBatchType } from "api/types/AchievementBatchType.ts";
import { StaffAchievementType } from "api/types/AchievementType.ts";
import { IoIosAddCircle } from "react-icons/io";
import classNames from "classnames";
import AchievementsBatch from "components/staff/AchievementsBatch.tsx";

type ViewType = "achievements" | "releases";
const VIEWS: ViewType[] = ["achievements", "releases"];

function getView(view: ViewType) {
  switch (view) {
    case "achievements":
      return <AchievementsView />;
    case "releases":
      return <ReleasesView />;
  }
}

export default function Index() {
  useAuthEnsurer().ensureStaff();

  const [view, setView] = useState<ViewType>("releases");

  return (
    <div className="staff__page">
      <ViewSwitcher views={VIEWS} currentView={view} setView={setView} />
      {getView(view)}
    </div>
  );
}

function AchievementsView() {
  const { data: achievements, isLoading } = useGetStaffAchievements();
  const state = useStateContext();
  const dispatchState = useDispatchStateContext();
  const session = useContext(SessionContext);

  const [creationOpen, setCreationOpen] = useState(false);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (achievements === undefined) {
    return <div>Failed to load achievements</div>;
  }

  if (state.achievementsFilter === null) {
    dispatchState({
      id: 5,
      achievementsFilter: getDefaultNav(achievements, true),
    });
    return <div>Loading...</div>;
  }

  const onOpenCreation = () => {
    setCreationOpen(true);
  };

  const onCancelCreation = () => {
    setCreationOpen(false);
  };

  let filteredAchievements = achievements;
  if (state.showMyAchievements) {
    filteredAchievements = achievements.filter(
      (a) => a.creator !== null && a.creator.id === session.user!.id,
    );
  }

  const sortedAchievements = getSortedAchievements(
    filteredAchievements,
    state.achievementsFilter,
    state.achievementsSearchFilter,
    false,
    null,
  );

  return (
    <>
      <Helmet>
        <title>CTA - Staff Achievements</title>
      </Helmet>
      <h1>{achievements.length} Achievements</h1>
      <div className="staff__interaction-bar">
        <Button
          children="Create achievement"
          hidden={creationOpen}
          onClick={onOpenCreation}
        />
      </div>
      <AchievementNavigationBar
        key="staff"
        state={state}
        dispatchState={dispatchState}
        achievements={achievements}
        isStaff={true}
      />
      <AchievementCreation
        hidden={!creationOpen}
        onCancelCreation={onCancelCreation}
        submitText="Create"
      />
      <div className="staff__achievement-container">
        {/* sorting for staff page puts everything under the 'values' category */}
        {(sortedAchievements["values"] ?? []).map((a) => (
          <Achievement key={a.id} achievement={a} />
        ))}
      </div>
    </>
  );
}

function ReleasesView() {
  const session = useContext(SessionContext);
  const { data: achievements, isLoading: achievementsLoading } =
    useGetStaffAchievements(true);
  const { data: batches, isLoading: batchesLoading } = useGetBatches();
  const createBatch = useCreateBatch();

  const [batchDate, setBatchDate] = useState("");
  const [debounce, setDebounce] = useState(false);

  const dispatchEventMsg = useContext(EventContext);

  if (achievementsLoading || batchesLoading) {
    return <h1>Loading...</h1>;
  }

  if (achievements === undefined || batches == undefined) {
    return <h1>Failed to load</h1>;
  }

  // batch sorting/grouping
  let groupedBatches: [AchievementBatchType, StaffAchievementType[]][] =
    batches.map((b) => [b, []]);

  for (const achievement of achievements) {
    for (const batch of groupedBatches) {
      if (batch[0].id == achievement.batch!.id) {
        batch[1].push(achievement);
        break;
      }
    }
  }

  function doCreateBatch() {
    if (debounce) {
      return;
    }

    if (batchDate.length === 0) {
      dispatchEventMsg({ type: "error", msg: "Invalid date" });
      return;
    }

    setDebounce(true);

    createBatch.mutate(
      { release_time: Math.floor(Date.parse(batchDate) / 1000) },
      {
        onSuccess: () =>
          dispatchEventMsg({
            type: "info",
            msg: "Successfully created new batch",
          }),
        onSettled: () => {
          createBatch.reset();
          setDebounce(false);
          setBatchDate("");
        },
      },
    );
  }

  function sortBatches(
    a: [AchievementBatchType, StaffAchievementType[]],
    b: [AchievementBatchType, StaffAchievementType[]],
  ) {
    return Date.parse(a[0].release_time) - Date.parse(b[0].release_time);
  }

  return (
    <>
      <Helmet>
        <title>CTA - Staff Releases</title>
      </Helmet>
      <h1>{achievements.length} Achievements</h1>
      <div
        className={classNames("batch-input-row", {
          hide: session.user!.is_admin,
        })}
      >
        <input
          type="datetime-local"
          value={batchDate}
          onChange={(evt) => setBatchDate(evt.currentTarget.value)}
        />
        <IoIosAddCircle
          size={48}
          className={classNames({ clickable: !debounce })}
          onClick={doCreateBatch}
        />
      </div>
      <div className="staff-batches-listing-container">
        <div className="staff-batches-listing">
          {groupedBatches.sort(sortBatches).map(([batch, achievements], i) => (
            <AchievementsBatch
              title={`Batch ${i + 1}`}
              batch={batch}
              achievements={achievements}
            />
          ))}
        </div>
      </div>
    </>
  );
}
