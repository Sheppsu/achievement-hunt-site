import { StaffAchievementType } from "api/types/AchievementType.ts";
import Achievement from "components/staff/Achievement.tsx";
import { AchievementBatchType } from "api/types/AchievementBatchType.ts";
import { useState } from "react";

export default function AchievementsBatch({
  title,
  batch,
  achievements,
}: {
  title: string;
  batch: AchievementBatchType;
  achievements: StaffAchievementType[];
}) {
  const [showAchievement, setShowAchievements] = useState(false);

  return (
    <div className="batch">
      <h1
        className="batch__title"
        onClick={() => setShowAchievements((val) => !val)}
      >
        {title}
      </h1>
      <p>{new Date(Date.parse(batch.release_time)).toString()}</p>
      {showAchievement ? (
        <div className="batch__achievements">
          {achievements.map((achievement) => (
            <Achievement achievement={achievement} />
          ))}
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
