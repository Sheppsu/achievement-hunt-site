import { timeAgo } from "util/helperFunctions.ts";
import {
  AnonymousAchievementCompletionType,
  AchievementCompletionType,
} from "api/types/AchievementCompletionType.ts";

function PlayerElement({
  completion,
  releaseTime,
}: {
  completion: AchievementCompletionType;
  releaseTime: string;
}) {
  const player = completion.player;

  const release = Date.parse(releaseTime);
  const completed = Date.parse(completion.time_completed);
  let lowerBound;
  let upperBound;
  let suffix;
  if (release < completed) {
    lowerBound = release;
    upperBound = completed;
    suffix = "after release";
  } else {
    lowerBound = completed;
    upperBound = release;
    suffix = "before release";
  }

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
        <p style={{ fontSize: "14px" }}>
          {timeAgo(lowerBound, upperBound, suffix)}
        </p>
      </div>
    </>
  );
}

export default function AchievementCompletionEntry({
  completion,
  releaseTime,
}: {
  completion: AchievementCompletionType | AnonymousAchievementCompletionType;
  releaseTime: string;
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
      {"player" in completion ? (
        <PlayerElement releaseTime={releaseTime} completion={completion} />
      ) : (
        ""
      )}
    </div>
  );
}
