import { AchievementCompletionType } from "api/types/AchievementCompletionType.ts";
import {
  AchievementExtendedType,
  TAG_DESCRIPTIONS,
} from "api/types/AchievementType";
import classNames from "classnames";
import AchievementCompletionEntry from "components/achievements/AchievementCompletionEntry.tsx";
import AudioPlayer from "components/audio/AudioPlayer.tsx";
import { parseTags, toTitleCase } from "util/helperFunctions";
import React, {
  MouseEventHandler,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import Button from "components/inputs/Button.tsx";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TextInput from "components/inputs/TextInput.tsx";
import { WebsocketContext } from "contexts/WebsocketContext.tsx";

export default function Achievement({
  achievement,
  completed,
  points,
}: {
  achievement: AchievementExtendedType;
  completed: boolean | null;
  points: number | null;
}) {
  const wsCtx = useContext(WebsocketContext);

  const [showCompletions, setShowCompletions] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const popupRef = useRef<null | HTMLDivElement>(null);

  const completions = achievement.completions;
  const tags = useMemo(() => parseTags(achievement.tags), [achievement.tags]);
  const hasPasswordTag = useMemo(() => tags.includes("password"), [tags]);

  let infoCls = "achievement__container ";
  if (completed == null) {
    infoCls += "neutral";
  } else if (completed) {
    infoCls += "complete";
  } else {
    infoCls += "incomplete";
  }

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

  const onPasswordSubmitted = useCallback((e: React.SubmitEvent) => {
    e.preventDefault();

    // TODO
  }, []);

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

  // for CTA2 achievement
  let dataAttributes = {};
  if (achievement.id === 219) {
    dataAttributes = {
      "data-beatmap-id": 1138718,
      "data-misses": 4,
      "data-100s": 4,
    };
  }

  const hasHiddenBeatmap = () => {
    for (const bm of achievement.beatmaps) {
      if (bm.hide) return true;
    }
    return false;
  };

  const showSolutionBtn = achievement.solution || hasHiddenBeatmap();

  let beatmapsToShow = achievement.beatmaps;
  if (!showSolution) beatmapsToShow = beatmapsToShow.filter((b) => !b.hide);

  return (
    <>
      <div className="achievement__tag-description" ref={popupRef}></div>
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
            <div className="achievement__container__info__description">
              <Markdown remarkPlugins={[remarkGfm]}>
                {`${achievement.completion_count} completions | ` +
                  achievement.description}
              </Markdown>
              {showSolutionBtn && (
                <>
                  <Button
                    children={showSolution ? "Hide solution" : "Show solution"}
                    width="auto"
                    className="achievement__show-solution-btn"
                    onClick={() => setShowSolution(!showSolution)}
                  />
                  {showSolution && (
                    <span style={{ color: "#ffc0c0" }}>
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {achievement.solution!}
                      </Markdown>
                    </span>
                  )}
                </>
              )}
            </div>
            {hasPasswordTag && !showSolutionBtn && (
              <form
                className="achievement__info-row"
                onSubmit={(e) => onPasswordSubmitted(e)}
              >
                <TextInput
                  name="guess"
                  placeholder="Guess password"
                  autocomplete="off"
                />
                <Button
                  children="Submit"
                  type="submit"
                  unavailable={completed ?? false}
                />
              </form>
            )}
            {achievement.creator && (
              <p className="achievement__creator">
                Creator:{" "}
                <a
                  className="rendered-text"
                  href={`https://osu.ppy.sh/u/${achievement.creator.id}`}
                  target="_blank"
                >
                  {achievement.creator.username}
                </a>
              </p>
            )}
            <div className="achievement__container__info__tags">
              {tags.map((tag) => (
                <div
                  key={tag}
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

        {beatmapsToShow.map((beatmap) => (
          <a
            key={beatmap.info.id}
            href={`https://osu.ppy.sh/b/${beatmap.info.id}`}
            target="_blank"
          >
            <div
              className={classNames("achievement__beatmap", {
                red: beatmap.hide,
              })}
            >
              <img
                className="achievement__beatmap__cover"
                src={beatmap.info.cover}
                alt=""
              ></img>
              <div className="achievement__beatmap__info">
                <p className="achievement-beatmap-text">
                  {beatmap.info.artist} - {beatmap.info.title}
                </p>
                <p className="achievement-beatmap-text">
                  [{beatmap.info.version}]
                </p>
              </div>
              <h1 className="achievement__beatmap__star-rating achievement-beatmap-text">
                {Math.round(beatmap.info.star_rating * 100) / 100}*
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
                    Date.parse((b as AchievementCompletionType).time_completed)
                  : a.placement!.place - b.placement!.place,
              )
              .map((completion, i) => (
                <AchievementCompletionEntry
                  key={i}
                  completion={completion}
                  releaseTime={achievement.batch!.release_time}
                />
              ))}
          </div>
        )}
      </div>
    </>
  );
}
