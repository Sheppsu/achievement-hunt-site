import React, { useCallback, useContext, useMemo, useState } from "react";
import { SessionContext } from "contexts/SessionContext.ts";
import {
  useCreateBatch,
  useGetBatches,
  useGetStaffAchievements,
} from "api/query.ts";
import { EventContext } from "contexts/EventContext.ts";
import { AchievementBatchType } from "api/types/AchievementBatchType.ts";
import { StaffAchievementType } from "api/types/AchievementType.ts";
import { Helmet } from "react-helmet";
import classNames from "classnames";
import { IoIosAddCircle } from "react-icons/io";
import AchievementsBatch from "components/staff/AchievementsBatch.tsx";
import AchievementNavigationBar from "components/achievements/AchievementNavigationBar.tsx";
import {
  useDispatchStateContext,
  useStateContext,
} from "contexts/StateContext.ts";
import { getSortedAchievements } from "util/achievementSorting.ts";
import { parseMode, parseTags } from "util/helperFunctions.ts";

export default function ReleasesView({
  setView,
}: {
  setView: (value: any) => void;
}) {
  const session = useContext(SessionContext);
  const { data: achievements, isLoading: achievementsLoading } =
    useGetStaffAchievements(true);
  const { data: batches, isLoading: batchesLoading } = useGetBatches();
  const createBatch = useCreateBatch();

  const [batchDate, setBatchDate] = useState("");
  const [debounce, setDebounce] = useState(false);

  const dispatchEventMsg = useContext(EventContext);
  const state = useStateContext();
  const dispatchState = useDispatchStateContext();

  const sortedAchievements = useMemo(() => {
    if (!achievements || state.achievementsFilter === null) {
      return null;
    }
    return Object.entries(
      getSortedAchievements(
        achievements,
        state.achievementsFilter,
        state.achievementsSearchFilter,
        false,
        null,
        session.user,
      ),
    )
      .map(([key, a]) => a)
      .flat();
  }, [
    achievements,
    state.achievementsFilter,
    state.achievementsSearchFilter,
    session.user,
  ]);
  const modeCounts = useMemo(() => {
    const counts = {
      any: 0,
      "mode-o": 0,
      "mode-m": 0,
      "mode-f": 0,
      "mode-t": 0,
    };

    if (achievements) {
      for (const achievement of achievements) {
        counts[parseMode(achievement.tags)] += 1;
      }
    }

    return counts;
  }, [achievements]);
  const tagCounts = useMemo(() => {
    const counts = {
      secret: 0,
      competition: 0,
      puzzle: 0,
      password: 0,
    };

    if (achievements) {
      for (const achievement of achievements) {
        for (const tag of parseTags(achievement.tags, false)) {
          if (tag in counts) {
            counts[tag as keyof typeof counts] += 1;
          }
        }
      }
    }

    return counts;
  }, [achievements]);

  // batch sorting/grouping
  let groupedBatches = useMemo(() => {
    if (!sortedAchievements || !batches) {
      return null;
    }

    const result: [AchievementBatchType, StaffAchievementType[]][] =
      batches.map((b) => [b, []]);

    for (const achievement of sortedAchievements) {
      for (const batch of result) {
        if (batch[0].id == achievement.batch!.id) {
          batch[1].push(achievement);
          break;
        }
      }
    }

    return result;
  }, [batches, sortedAchievements]);

  const doCreateBatch = useCallback(() => {
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
  }, [
    debounce,
    setDebounce,
    batchDate,
    setBatchDate,
    createBatch,
    dispatchEventMsg,
  ]);

  const sortBatches = useCallback(
    (
      a: [AchievementBatchType, StaffAchievementType[]],
      b: [AchievementBatchType, StaffAchievementType[]],
    ) => {
      return Date.parse(a[0].release_time) - Date.parse(b[0].release_time);
    },
    [],
  );

  if (achievementsLoading || batchesLoading) {
    return <h1>Loading...</h1>;
  }

  if (achievements === undefined || batches == undefined) {
    return <h1>Failed to load</h1>;
  }

  return (
    <>
      <Helmet>
        <title>CTA - Staff Releases</title>
      </Helmet>
      <h1>{achievements.length} Achievements</h1>
      <h1>Mode stats</h1>
      <p>
        Any: {modeCounts["any"]} | Standard: {modeCounts["mode-o"]} | Taiko:{" "}
        {modeCounts["mode-t"]} | Catch: {modeCounts["mode-f"]} | Mania:{" "}
        {modeCounts["mode-m"]}
      </p>
      <h1>Tag stats</h1>
      <p>
        {Object.entries(tagCounts)
          .map(
            ([tag, count]) =>
              `${tag.substring(0, 1).toUpperCase()}${tag.substring(1)}: ${count}`,
          )
          .join(" | ")}
      </p>
      <div
        className={classNames("batch-input-row", {
          hide: !session.user!.is_admin,
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
      <AchievementNavigationBar
        state={state}
        dispatchState={dispatchState}
        achievements={achievements}
        isStaff={true}
      />
      <div className="staff-batches-listing">
        {groupedBatches!.sort(sortBatches).map(([batch, achievements], i) => (
          <AchievementsBatch
            title={`Batch ${i + 1}`}
            batch={batch}
            achievements={achievements}
            setView={setView}
          />
        ))}
      </div>
    </>
  );
}
