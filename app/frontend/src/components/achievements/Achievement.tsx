import { AchievementCompletionType } from "api/types/AchievementCompletionType.ts";
import { AchievementExtendedType } from "api/types/AchievementType";
import classNames from "classnames";
import AchievementCompletionEntry from "components/achievements/AchievementCompletionEntry.tsx";
import AudioPlayer from "components/audio/AudioPlayer.tsx";
import { AppState } from "types/AppStateType.ts";
import { parseTags, toTitleCase } from "util/helperFunctions";
import { useState } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

export default function Achievement({
  achievement,
  completed,
  points,
  state,
}: {
  achievement: AchievementExtendedType;
  completed: boolean;
  points: number | null;
  state: AppState;
}) {
  const [showCompletions, setShowCompletions] = useState(false);

  const completions = achievement.completions;
  const tags = parseTags(achievement.tags);

  const infoCls =
    "achievement__container " + (completed ? "complete" : "incomplete");

  const dropdownArrowProps = {
    size: 36,
    onClick: () => setShowCompletions((v) => !v),
    className: "clickable",
  };

  return (
    <>
      {state.hideCompletedAchievements && completed ? (
        <></>
      ) : (
        <div className="achievement">
          <div className={infoCls}>
            <div className="achievement__container__info">
              <div style={{ display: "flex" }}>
                <h1 style={{ flexGrow: "1" }}>{achievement.name}</h1>
                <div style={{ flexBasis: "100px" }}></div>
              </div>
              <p className="achievement__points">
                {points === null ? "" : `${points}pts`}
              </p>
              <p className="achievement__container__info__description">{`${achievement.completion_count} completions | ${achievement.description}`}</p>
              <div className="achievement__container__info__tags">
                {tags.map((tag) => (
                  <div className="achievement-tag">{toTitleCase(tag)}</div>
                ))}
                <div style={{ flexGrow: 1 }}></div>
                {completions.length > 0 ? (
                  showCompletions ? (
                    <IoIosArrowUp {...dropdownArrowProps} />
                  ) : (
                    <IoIosArrowDown {...dropdownArrowProps} />
                  )
                ) : (
                  ""
                )}
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
              <div className="achievement__beatmap">
                <img
                  className="achievement__beatmap__cover"
                  src={beatmap.info.cover}
                  alt=""
                ></img>
                <div className="achievement__beatmap__info">
                  <p>
                    {beatmap.info.artist} - {beatmap.info.title}
                  </p>
                  <p>[{beatmap.info.version}]</p>
                </div>
                <h1 className="achievement__beatmap__star-rating">
                  {beatmap.info.star_rating}*
                </h1>
              </div>
            </a>
          ))}
          <hr
            className={classNames({
              hide:
                achievement.beatmaps.length == 0 ||
                completions.length === 0 ||
                !showCompletions,
            })}
          />

          {completions.length == 0 || !showCompletions ? (
            ""
          ) : (
            <div className="achievement__players">
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
