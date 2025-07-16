import { AchievementCompletionType } from "api/types/AchievementCompletionType.ts";
import { AchievementExtendedType } from "api/types/AchievementType";
import classNames from "classnames";
import AchievementCompletionEntry from "components/achievements/AchievementCompletionEntry.tsx";
import AudioPlayer from "components/audio/AudioPlayer.tsx";
import { AppState } from "types/AppStateType.ts";
import { parseTags, toTitleCase } from "util/helperFunctions";
import { MouseEventHandler, useRef, useState } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import RenderedText from "components/common/RenderedText.tsx";

const TAG_DESCRIPTIONS = {
  secret: "The solution to this achievement is not explicitly stated.",
  chat: "Completing this achievement involves sending an in-game DM to Sheppsu as part of the solution (messages checked by the server).",
  competition:
    "This achievement has a leaderboard and points are awarded based on your placement. Completions can be overruled with better ones by anyone on your team.",
  expert: "This achievement cannot be completed with the use of NF.",
  gimmick:
    "Completing this achievement requires a gimmick skill or non-conventional way of playing.",
  knowledge:
    "Finding the solution requires some non-basic level of knowledge about osu, osu history, or related (or requires research).",
  lazer: "This achievement must be completed on the lazer client.",
  stable: "This achievement must be completed on the stable client.",
  math: "Finding the solution involves decently heavy use of math.",
  puzzle:
    "The achievement involves some kind of puzzle (e.g. sudoku, logic puzzle).",
  skill:
    "Completing the achievement involves a decent level of skill (this tag is somewhat subjective).",
};

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
  const popupRef = useRef<null | HTMLDivElement>(null);

  const completions = achievement.completions;
  const tags = parseTags(achievement.tags);

  const infoCls =
    "achievement__container " + (completed ? "complete" : "incomplete");

  const dropdownArrowProps = {
    size: 36,
    onClick: () => setShowCompletions((v) => !v),
    className: "clickable",
  };

  const onTagClicked: MouseEventHandler<HTMLDivElement> = (evt) => {
    if (popupRef.current === null) return;

    const popup = popupRef.current;
    const target = evt.target as HTMLDivElement;

    popup.innerText =
      // @ts-ignore
      TAG_DESCRIPTIONS[target.innerText.toLowerCase()] ??
      "No description for this tag";
    popup.style.display = "block";

    const rect = target.getBoundingClientRect();
    const centerX = (rect.left + rect.right) / 2;
    const centerY = (rect.top + rect.bottom) / 2;

    const popupLeft = window.scrollX + centerX - 150;
    const popupTop = window.scrollY + centerY - popup.offsetHeight - 40;

    popup.style.left = `${popupLeft}px`;
    popup.style.top = `${popupTop}px`;
  };

  document.addEventListener("click", (evt) => {
    const popup = popupRef.current;
    const target = evt.target as Node | HTMLElement | null;
    if (
      popup === null ||
      target === null ||
      ("classList" in target && target.classList.contains("achievement-tag")) ||
      target == popup ||
      popup.contains(target)
    )
      return;

    if (popup.style.display === "block") popup.style.display = "none";
  });

  let dataAttributes = {};
  if (achievement.id === 219) {
    dataAttributes = {
      "data-beatmap-id": 1138718,
      "data-misses": 4,
      "data-100s": 4,
    };
  }

  return (
    <>
      <div className="achievement__tag-description" ref={popupRef}></div>
      {state.hideCompletedAchievements && completed ? (
        <></>
      ) : (
        <div className="achievement">
          <div className={infoCls}>
            <div className="achievement__container__info">
              <div style={{ display: "flex" }}>
                <h1
                  style={{ flexGrow: "1", wordBreak: "break-word" }}
                  {...dataAttributes}
                >
                  {achievement.name}
                </h1>
                <div style={{ flexBasis: "120px" }}></div>
              </div>
              <p className="achievement__points">
                {points === null ? "" : `${points}pts`}
              </p>
              <p className="achievement__container__info__description">
                {`${achievement.completion_count} completions | `}
                <RenderedText text={achievement.description} />
              </p>
              <div className="achievement__container__info__tags">
                {tags.map((tag) => (
                  <div
                    className="achievement-tag clickable"
                    onClick={onTagClicked}
                  >
                    {toTitleCase(tag)}
                  </div>
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
                    : a.placement!.place - b.placement!.place,
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
