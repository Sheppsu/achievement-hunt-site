import { useGetAchievements } from "api/query";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType";
import { AchievementExtendedType } from "api/types/AchievementType";
import { WebsocketContext } from "contexts/WebsocketContext";
import { useContext } from "react";
import { EventIterationType } from "api/types/EventIterationType.ts";
import { StateContext } from "contexts/StateContext.ts";

export default function AchievementProgress({
  team,
  iteration,
}: {
  team: AchievementTeamExtendedType | null;
  iteration: EventIterationType;
}) {
  const { wsState, sendSubmit } = useContext(WebsocketContext)!;
  const appState = useContext(StateContext);

  const { data: achievements } = useGetAchievements();

  const eventEnded: boolean = Date.now() >= Date.parse(iteration.end);

  if (team === null || achievements === undefined) {
    return <div>Loading team progress...</div>;
  }

  // count number of completed achievements
  let achievementCount = 0;
  for (const achievement of achievements) {
    for (const completion of achievement.completions) {
      for (const player of team.players) {
        if ("player" in completion && completion.player.id === player.id) {
          achievementCount += 1;
          break;
        }
      }
    }
  }

  const submitDisabled =
    !wsState?.connected || eventEnded || !appState?.submitEnabled;
  const submitCls = "submit-button" + (submitDisabled ? " disabled" : "");

  function onSubmit() {
    if (submitDisabled) return;
    sendSubmit();
  }

  const progressPercent = (achievementCount / achievements.length) * 100;
  const progressStyle = `linear-gradient(
    to right,
    #fff,
    #fff ${progressPercent}%,
    var(--background-color) ${progressPercent}%,
    var(--background-color) 100%
  )`;

  return (
    <div className="achievements-progress__container">
      <div className="achievements-progress__container__left-box">
        <h1>Achievement progress</h1>
        <h1>{`${achievementCount}/${
          (achievements as AchievementExtendedType[]).length
        }`}</h1>
        <div
          className="achievements-progress-bar"
          style={{
            background: progressStyle,
          }}
        >
          <div className="achievements-progress-bar__inner"></div>
        </div>
      </div>
      <div className={submitCls} onClick={onSubmit}>
        Submit
      </div>
    </div>
  );
}
