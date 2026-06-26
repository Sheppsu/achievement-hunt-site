import { StaffAchievementType } from "api/types/AchievementType.ts";
import Achievement from "components/staff/Achievement.tsx";
import { AchievementBatchType } from "api/types/AchievementBatchType.ts";
import { useCallback, useMemo, useState } from "react";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";

function getStatStyle(value: number) {
  return {
    backgroundColor: `color-mix(in srgb, red ${(10 - value) * 10}%, green ${value * 10}%)`,
    borderRadius: "5px",
    padding: "2px",
  };
}

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

  const showStats = useMemo(
    () =>
      achievements.length > 1 &&
      achievements.every(
        (a) =>
          a.avg_quality_rating !== null && a.avg_difficulty_rating !== null,
      ),
    [achievements],
  );
  const difficultySpreadStat = useMemo(() => {
    if (!showStats) {
      return null;
    }

    const fulfillments = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const achievement of achievements) {
      for (let x = 1; x <= 10; x++) {
        fulfillments[x - 1] += Math.pow(
          0.5,
          Math.abs(x - achievement.avg_difficulty_rating!),
        );
      }
    }
    return (
      Math.round(fulfillments.reduce((a, b) => a + Math.min(1, b), 0) * 100) /
      100
    );
  }, [showStats, achievements]);
  const qualityMeanStat = useMemo(() => {
    if (!showStats) {
      return null;
    }

    return (
      Math.round(
        (achievements.reduce((sum, a) => sum + a.avg_quality_rating!, 0) /
          achievements.length) *
          100,
      ) / 100
    );
  }, [showStats, achievements]);

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
          <p className="staff-batch__footer-text">
            {new Date(Date.parse(batch.release_time)).toString()}
          </p>
          {showStats ? (
            <p className="staff-batch__footer-text">
              <span style={getStatStyle(difficultySpreadStat!)}>
                Difficulty Spread Score: {difficultySpreadStat}
              </span>{" "}
              <span style={getStatStyle(qualityMeanStat!)}>
                Quality Mean: {qualityMeanStat}
              </span>
            </p>
          ) : (
            ""
          )}
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
