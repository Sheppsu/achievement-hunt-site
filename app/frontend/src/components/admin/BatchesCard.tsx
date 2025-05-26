import { IoIosAddCircle } from "react-icons/io";
import classNames from "classnames";
import AchievementsBatch from "components/admin/AchievementsBatch.tsx";
import React, { useContext, useState } from "react";
import { EventContext } from "contexts/EventContext.ts";
import {
  useCreateBatch,
  useGetBatches,
  useGetStaffAchievements,
} from "api/query.ts";
import { AchievementBatchType } from "api/types/AchievementBatchType.ts";
import { StaffAchievementType } from "api/types/AchievementType.ts";

export default function BatchesCard() {
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
  let sortedBatches: [AchievementBatchType, StaffAchievementType[]][] = [];

  for (const batch of batches) {
    sortedBatches.push([batch, []]);
  }

  for (const achievement of achievements) {
    for (const batch of sortedBatches) {
      if (batch[0].id == achievement.batch_id) {
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
    <div className="card">
      <h1 className="card__title">Batches</h1>
      <div className="batches-container">
        <div className="batch-input-row">
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
        {sortedBatches.sort(sortBatches).map(([batch, achievements], i) => (
          <AchievementsBatch
            title={`Batch ${i + 1}`}
            batch={batch}
            achievements={achievements}
          />
        ))}
      </div>
    </div>
  );
}
