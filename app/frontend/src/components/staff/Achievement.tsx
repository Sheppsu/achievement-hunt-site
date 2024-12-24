import { StaffAchievementType } from "api/types/AchievementType.ts";
import { BiSolidUpArrow, BiUpArrow } from "react-icons/bi";

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
      <div className="staff__achievement__footer">
        <div className="staff__achievement__footer__vote-container">
          {achievement.vote_count}
          <BiUpArrow />
        </div>
        {achievement.tags.split(",").map((tag) => (
          <div className="staff__achievement__footer__tag">{tag}</div>
        ))}
      </div>
    </div>
  );
}
