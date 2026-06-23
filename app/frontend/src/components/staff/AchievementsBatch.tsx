import { StaffAchievementType } from "api/types/AchievementType.ts";
import Achievement from "components/staff/Achievement.tsx";
import { AchievementBatchType } from "api/types/AchievementBatchType.ts";
import { useCallback, useState } from "react";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";

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

  const onClick = useCallback(() => {
    setShowAchievements((v) => !v);
  }, []);

  return (
    <div className="staff-batch">
      <div className="staff-batch__banner">
        <div className="staff-batch__heading-container">
          <h1
            className="staff-batch__title"
            onClick={() => setShowAchievements((val) => !val)}
          >
            {title}
          </h1>
        </div>
        <div className="staff-batch__divider"></div>
        <div className="staff-batch__achievement-info">
          <div className="staff-batch__achievements-list">
            {achievements.map((achievement) => (
              <p key={achievement.id}>{achievement.name}</p>
            ))}
          </div>
          <p className="staff-batch__time">
            {new Date(Date.parse(batch.release_time)).toString()}
          </p>
        </div>
        {showAchievement ? (
          <IoIosArrowDropup
            className="staff-batch__dropdown"
            size={32}
            onClick={onClick}
          />
        ) : (
          <IoIosArrowDropdown
            className="staff-batch__dropdown"
            size={32}
            onClick={onClick}
          />
        )}
      </div>
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
