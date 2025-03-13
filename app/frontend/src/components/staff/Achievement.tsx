import { StaffAchievementType } from "api/types/AchievementType.ts";
import { BiSolidUpArrow, BiUpArrow } from "react-icons/bi";
import { useVoteAchievement } from "api/query.ts";

function VoteContainer({ achievement }: { achievement: StaffAchievementType }) {
  const vote = useVoteAchievement(achievement.id);

  const onClick = () => {
    vote.mutate(
      { add: !achievement.has_voted },
      {
        onSuccess: () => vote.reset(),
      },
    );
  };

  return (
    <div
      className="staff__achievement__footer__vote-container"
      onClick={onClick}
    >
      {achievement.vote_count}
      {achievement.has_voted ? <BiSolidUpArrow /> : <BiUpArrow />}
    </div>
  );
}

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
        <VoteContainer achievement={achievement} />
        {achievement.tags.split(",").map((tag) => (
          <div className="staff__achievement__footer__tag">{tag}</div>
        ))}
      </div>
    </div>
  );
}
