import { StaffAchievementType } from "api/types/AchievementType.ts";

export default function Achievement({
  achievement,
}: {
  achievement: StaffAchievementType;
}) {
  return (
    <div className="staff__achievement">
      <p className="staff__achievement__name">{achievement.name}</p>
      <p>{achievement.description}</p>
      <p className="staff__achievement__solution">{achievement.solution}</p>
    </div>
  );
}
