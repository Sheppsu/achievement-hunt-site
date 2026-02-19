import { StaffAchievementType } from "api/types/AchievementType.ts";
import Achievement from "components/staff/Achievement.tsx";
import { AchievementBatchType } from "api/types/AchievementBatchType.ts";
import { useState } from "react";

export default function AchievementsBatch({
  title,
  batch,
  achievements,
  setView,
}: {
  title: string;
  batch: AchievementBatchType;
  achievements: StaffAchievementType[];
  setView: (value: any) => void;
}) {
  const [showAchievement, setShowAchievements] = useState(false);

  return (
    <div className="staff-batch">
      <h1
        className="staff-batch__title"
        onClick={() => setShowAchievements((val) => !val)}
      >
        {title}
      </h1>
      <p>{new Date(Date.parse(batch.release_time)).toString()}</p>
      {showAchievement ? (
        <div className="staff-batch__achievements">
          {achievements.map((achievement) => (
            <Achievement achievement={achievement} setView={setView} />
          ))}
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
