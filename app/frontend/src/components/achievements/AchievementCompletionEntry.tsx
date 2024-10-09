import {AchievementCompletionType} from "api/types/AchievementType.ts";
import {timeAgo} from "util/helperFunctions.ts";

export default function AchievementCompletionEntry({
  completion
}: {
  completion: AchievementCompletionType
}) {
  const player = completion.player;
  return (
    <div className="achievement-players-entry">
      <img
        className="achievement-players-entry-pfp"
        src={player.user.avatar}
      ></img>
      <div>
        <p>
          <b>{player.user.username}</b>
        </p>
        <p style={{fontSize: "14px"}}>
          {timeAgo(completion.time_completed)}
        </p>
      </div>
    </div>
  );
}