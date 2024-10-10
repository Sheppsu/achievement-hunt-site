import {timeAgo} from "util/helperFunctions.ts";
import { AnonymousAchievementCompletionType, AchievementCompletionType } from "api/types/AchievementCompletionType.ts";

function PlayerElement({completion}: {completion: AchievementCompletionType}) {
  const player = completion.player;

  return (
    <>
      <img
        className="achievement-players-entry-pfp"
        src={player.user.avatar}
        alt=""
      ></img>
      <div>
        <p>
          <b>{player.user.username}</b>
        </p>
        <p style={{fontSize: "14px"}}>
          {timeAgo(completion.time_completed)}
        </p>
      </div>
    </>
  );
}

export default function AchievementCompletionEntry({
  completion
}: {
  completion: AchievementCompletionType | AnonymousAchievementCompletionType
}) {
  return (
    <div className="achievement-players-entry">
      {
        "placement" in completion ? <p>{completion.placement!.value}</p> : ""
      }
      {
        "player" in completion ? <PlayerElement completion={completion} /> : ""
      }
    </div>
  );
}