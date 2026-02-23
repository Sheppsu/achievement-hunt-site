import { useGetPlaytestPasskey, useGetStaffAchievements } from "api/query.ts";
import Achievement from "components/staff/Achievement.tsx";
import "assets/css/staff.css";
import AchievementNavigationBar, {
  getDefaultNav,
} from "components/achievements/AchievementNavigationBar.tsx";
import { SessionContext } from "contexts/SessionContext.ts";
import {
  useDispatchStateContext,
  useStateContext,
} from "contexts/StateContext.ts";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { getSortedAchievements } from "util/achievementSorting.ts";
import { useAuthEnsurer } from "util/auth.ts";
import { Helmet } from "react-helmet";
import ViewSwitcher from "components/common/ViewSwitcher.tsx";
import ReleasesView from "routes/staff/releases.tsx";
import CreationView from "routes/staff/creation.tsx";
import { useLocation } from "react-router-dom";
import Button from "components/inputs/Button.tsx";
import { EventContext } from "contexts/EventContext.ts";
import { IoIosCopy, IoIosRefresh } from "react-icons/io";

const VIEWS = ["achievements", "creation", "releases"] as const;
type ViewName = (typeof VIEWS)[number];
type ViewType = {
  name: ViewName;
  props: any;
};

function getViewComponent(view: ViewType, setView: (value: ViewType) => void) {
  switch (view.name) {
    case "achievements":
      return <AchievementsView setView={setView} {...view.props} />;
    case "releases":
      return <ReleasesView setView={setView} {...view.props} />;
    case "creation":
      return <CreationView setView={setView} {...view.props} />;
  }
}

export default function Index() {
  useAuthEnsurer().ensureStaff();

  const location = useLocation();
  const [view, setView] = useState<ViewType>(
    location.state ?? {
      name: "achievements",
      props: {},
    },
  );
  const setViewName = useCallback((newName: ViewName) => {
    setView((_v) => ({ name: newName, props: {} }));
  }, []);

  return (
    <div className="staff__page">
      <ViewSwitcher
        views={VIEWS}
        currentView={view.name}
        setView={setViewName}
      />
      {getViewComponent(view, setView)}
    </div>
  );
}

function AchievementsView({ setView }: { setView: (value: ViewType) => void }) {
  const { data: achievements, isLoading } = useGetStaffAchievements();
  const {
    data: playtestInfo,
    refetch: fetchPasskey,
    isLoading: fetchingPasskey,
  } = useGetPlaytestPasskey();
  const state = useStateContext();
  const dispatchState = useDispatchStateContext();
  const session = useContext(SessionContext);
  const dispatchEventMsg = useContext(EventContext);

  const filteredAchievements = useMemo(() => {
    if (isLoading || achievements === undefined) {
      return null;
    }
    if (state.showMyAchievements) {
      return achievements.filter(
        (a) => a.creator !== null && a.creator.id === session.user!.id,
      );
    }
    return achievements;
  }, [achievements, session.user, state.showMyAchievements, isLoading]);

  // don't want to refresh everytime achievements change (it's a bit disorienting)
  // so fixed sorting is fixed based on the achievements when sort was set
  const fixedSorting: [string, number[]][] | null = useMemo(() => {
    if (filteredAchievements === null || state.achievementsFilter === null) {
      return null;
    }
    const sortedAchievements = getSortedAchievements(
      filteredAchievements,
      state.achievementsFilter,
      state.achievementsSearchFilter,
      false,
      null,
    );
    return Object.entries(sortedAchievements).map(([key, values]) => [
      key,
      values.map((a) => a.id),
    ]);
  }, [
    state.achievementsFilter,
    state.achievementsSearchFilter,
    state.showMyAchievements,
    isLoading,
  ]);

  // this is based on latest achievement data but uses fixed sorting
  const sortedAchievements = useMemo(() => {
    if (fixedSorting === null) {
      return null;
    }

    return Object.fromEntries(
      fixedSorting.map(([label, ids]) => [
        label,
        ids
          .map((id) =>
            filteredAchievements!.filter((ach) => ach.id === id).pop(),
          )
          .filter((ach) => ach !== undefined),
      ]),
    );
  }, [fixedSorting, filteredAchievements]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (achievements === undefined) {
    return <div>Failed to load achievements</div>;
  }

  if (sortedAchievements === null) {
    dispatchState({
      id: 5,
      achievementsFilter: getDefaultNav(achievements, true),
    });
    return <div>Loading...</div>;
  }

  const copyPasskey = () => {
    // playtestInfo is defined if this func is called
    navigator.clipboard.writeText(playtestInfo!.passkey).then(
      () => dispatchEventMsg({ type: "info", msg: "Passkey copied!" }),
      () =>
        dispatchEventMsg({
          type: "error",
          msg: "Failed to copy to clipboard... in which case ping sheppsu to add a reveal passkey thingy",
        }),
    );
  };

  return (
    <>
      <Helmet>
        <title>CTA - Staff Achievements</title>
      </Helmet>
      <h1>{achievements.length} Achievements</h1>
      <div className="staff__interaction-bar">
        <Button
          children={
            <>
              <IoIosRefresh />
              &nbsp;Generate Playtest Passkey
            </>
          }
          onClick={() => fetchPasskey()}
          unavailable={fetchingPasskey}
        />
        {playtestInfo === undefined ? (
          ""
        ) : (
          <Button
            children={
              <>
                <IoIosCopy />
                &nbsp;Copy Passkey
              </>
            }
            unavailable={fetchingPasskey}
            onClick={copyPasskey}
          />
        )}
      </div>
      <AchievementNavigationBar
        key="staff"
        state={state}
        dispatchState={dispatchState}
        achievements={achievements}
        isStaff={true}
      />
      <div className="staff__achievement-container">
        {/* sorting for staff page puts everything under the 'values' category */}
        {(sortedAchievements["values"] ?? []).map((a) => (
          <Achievement key={a.id} achievement={a} setView={setView} />
        ))}
      </div>
    </>
  );
}
