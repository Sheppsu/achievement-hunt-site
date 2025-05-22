import { timeAgo } from "util/helperFunctions.ts";
import {
  AnonymousAchievementCompletionType,
  AchievementCompletionType,
} from "api/types/AchievementCompletionType.ts";

function PlayerElement({
  completion,
}: {
  completion: AchievementCompletionType;
}) {
  const player = completion.player;

  return (
    <>
      <img
        className="achievement__players__entry__pfp"
        src={player.user.avatar}
        alt=""
      ></img>
      <div>
        <p>
          <b>{player.user.username}</b>
        </p>
        <p style={{ fontSize: "14px" }}>{timeAgo(completion.time_completed)}</p>
      </div>
    </>
  );
}

export default function AchievementCompletionEntry({
  completion,
}: {
  completion: AchievementCompletionType | AnonymousAchievementCompletionType;
}) {
  return (
    <div className="achievement__players__entry">
      {"placement" in completion &&
      completion.placement !== null &&
      completion.placement !== undefined ? (
        <>
          <p className="placement-text place">#{completion.placement!.place}</p>
          <p className="placement-text value">{completion.placement!.value}</p>
        </>
      ) : (
        ""
      )}
      {"player" in completion ? <PlayerElement completion={completion} /> : ""}
    </div>
  );
}
