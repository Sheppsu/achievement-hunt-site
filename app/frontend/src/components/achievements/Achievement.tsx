import { AchievementExtendedType } from "api/types/AchievementType";
import { toTitleCase } from "util/helperFunctions";
import AchievementCompletionEntry from "components/achievements/AchievementCompletionEntry.tsx";
import { AchievementCompletionType } from "api/types/AchievementCompletionType.ts";
import AudioPlayer from "components/audio/AudioPlayer.tsx";
import { WebsocketState } from "types/WebsocketStateType.ts";

export default function Achievement({
  achievement,
  completed,
  state,
}: {
  achievement: AchievementExtendedType;
  completed: boolean;
  state: WebsocketState;
}) {
  const rawTags = achievement.tags.split(",");
  const completions = achievement.completions;

  const modeMap: { [_k: string]: string } = {
    "mode-o": "standard",
    "mode-t": "taiko",
    "mode-f": "catch",
    "mode-m": "mania",
  };

  let mode: string | null = null;
  const filteredTags: string[] = [];
  for (const tag of rawTags) {
    if (tag === "") continue;

    if (tag.startsWith("mode-")) {
      mode = modeMap[tag];
      continue;
    }

    filteredTags.push(tag);
  }

  const tags = [`Mode: ${mode ?? "any"}`].concat(filteredTags);

  const infoCls =
    "achievement-info-container" + (completed ? " complete" : " incomplete");

  return (
    <>
      {state.hideCompletedAchievements && completed ? (
        <></>
      ) : (
        <div className="achievement">
          <div className={infoCls}>
            <div className="achievement-info">
              <h1>{achievement.name}</h1>
              <p className="achievement-info-description">
                {achievement.completion_count} completions |{" "}
                {achievement.description}
              </p>
              <div className="achievement-tags-container">
                {tags.map((tag) => (
                  <div className="achievement-tag">{toTitleCase(tag)}</div>
                ))}
              </div>
            </div>
            <h1>{completed ? "Complete" : "Incomplete"}</h1>
          </div>

          {achievement.audio === null || achievement.audio === "" ? (
            ""
          ) : (
            <AudioPlayer currentSong={achievement.audio} />
          )}

          {achievement.beatmap === null ? (
            ""
          ) : (
            <a
              href={`https://osu.ppy.sh/b/${achievement.beatmap.id}`}
              target="_blank"
            >
              <div className="achievement-details-container">
                <img
                  className="achievement-details-cover"
                  src={achievement.beatmap.cover}
                  alt=""
                ></img>
                <div className="achievement-details-beatmap-info">
                  <p className="achievement-details-beatmap-info-text">
                    {achievement.beatmap.artist} - {achievement.beatmap.title}
                  </p>
                  <p className="achievement-details-beatmap-info-text">
                    [{achievement.beatmap.version}]
                  </p>
                </div>
                <h1 className="achievement-details-star-rating">
                  {achievement.beatmap.star_rating}*
                </h1>
              </div>
            </a>
          )}
          {achievement.beatmap === null || completions.length === 0 ? (
            ""
          ) : (
            <hr />
          )}
          {completions.length == 0 ? (
            ""
          ) : (
            <div className="achievement-players-container">
              {completions
                .sort((a, b) =>
                  a.placement === undefined
                    ? Date.parse(
                        (a as AchievementCompletionType).time_completed,
                      ) -
                      Date.parse(
                        (b as AchievementCompletionType).time_completed,
                      )
                    : b.placement!.value - a.placement.value,
                )
                .map((completion, i) => (
                  <AchievementCompletionEntry key={i} completion={completion} />
                ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
