import { AchievementExtendedType } from "api/types/AchievementType";
import { parseTags, toTitleCase } from "util/helperFunctions";
import AchievementCompletionEntry from "components/achievements/AchievementCompletionEntry.tsx";
import { AchievementCompletionType } from "api/types/AchievementCompletionType.ts";
import AudioPlayer from "components/audio/AudioPlayer.tsx";
import { WebsocketState } from "types/WebsocketStateType.ts";
import classNames from "classnames";

export default function Achievement({
  achievement,
  completed,
  points,
  state,
}: {
  achievement: AchievementExtendedType;
  completed: boolean;
  points: number | null;
  state: WebsocketState;
}) {
  const completions = achievement.completions;
  const tags = parseTags(achievement.tags);

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
              <div style={{ display: "flex" }}>
                <h1 style={{ flexGrow: "1" }}>{achievement.name}</h1>
                <div style={{ flexBasis: "100px" }}></div>
              </div>
              <p className="achievement-points-label">
                {points === null ? "" : `${points}pts`}
              </p>
              <p className="achievement-info-description">{`${achievement.completion_count} completions | ${achievement.description}`}</p>
              <div className="achievement-tags-container">
                {tags.map((tag) => (
                  <div className="achievement-tag">{toTitleCase(tag)}</div>
                ))}
              </div>
            </div>
          </div>

          {achievement.audio === null || achievement.audio === "" ? (
            ""
          ) : (
            <AudioPlayer currentSong={achievement.audio} />
          )}

          {achievement.beatmaps.map((beatmap) => (
            <a href={`https://osu.ppy.sh/b/${beatmap.info.id}`} target="_blank">
              <div className="achievement-details-container">
                <img
                  className="achievement-details-cover"
                  src={beatmap.info.cover}
                  alt=""
                ></img>
                <div className="achievement-details-beatmap-info">
                  <p className="achievement-details-beatmap-info-text">
                    {beatmap.info.artist} - {beatmap.info.title}
                  </p>
                  <p className="achievement-details-beatmap-info-text">
                    [{beatmap.info.version}]
                  </p>
                </div>
                <h1 className="achievement-details-star-rating">
                  {beatmap.info.star_rating}*
                </h1>
              </div>
            </a>
          ))}
          <hr
            className={classNames({
              hide:
                achievement.beatmaps.length == 0 || completions.length === 0,
            })}
          />
          {completions.length == 0 ? (
            ""
          ) : (
            <div className="achievement-players-container">
              {completions
                .sort((a, b) =>
                  a.placement === undefined || a.placement === null
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
