import { useGetAchievements, useGetTeams } from "api/query";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType";
import "assets/css/achievements.css";
import AchievementContainer from "components/achievements/AchievementContainer";
import AchievementNavigationBar, {
  getDefaultNav,
} from "components/achievements/AchievementNavigationBar.tsx";
import AchievementProgress from "components/achievements/AchievementProgress.tsx";
import { SessionContext } from "contexts/SessionContext";
import {
  StateDispatch,
  useDispatchStateContext,
  useStateContext,
} from "contexts/StateContext.ts";
import { AnimationScope, useAnimate } from "motion/react";
import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { WebsocketState } from "types/WebsocketStateType.ts";
import { getMyTeam } from "util/helperFunctions";

function getTimeStr(delta: number) {
  const days = Math.floor((delta / (1000 * 60 * 60 * 24)) % 60);
  const hours = Math.floor((delta / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((delta / (1000 * 60)) % 60);
  const seconds = Math.floor((delta / 1000) % 60);
  return [days, hours, minutes, seconds]
    .map((n) => (n < 10 ? "0" + n : "" + n))
    .join(":");
}

function HiddenAchievementCompletionPage({
  time,
  eventStart,
}: {
  time: number;
  eventStart: number;
}) {
  const delta = eventStart - time;
  const timeString = getTimeStr(delta);

  return (
    <div style={{ margin: "auto", textAlign: "center", marginTop: "20px" }}>
      <h1 style={{ fontSize: "3em" }}>Starts in {timeString}</h1>
    </div>
  );
}

function LimitedAchievementCompletionPage({
  state,
  scope,
}: {
  state: WebsocketState;
  scope: AnimationScope;
}) {
  return <AchievementContainer scope={scope} state={state} />;
}

function FullAchievementCompletionPage({
  team,
  state,
  scope,
  dispatchState,
  hidden,
}: {
  team: AchievementTeamExtendedType | null;
  state: WebsocketState;
  scope: AnimationScope;
  dispatchState: StateDispatch;
  hidden: boolean;
}) {
  return (
    <>
      <AchievementContainer scope={scope} state={state} />
      <div className="achievements-progress">
        <AchievementProgress
          state={state}
          dispatchState={dispatchState}
          team={team}
          hidden={hidden}
        />
      </div>
    </>
  );
}

export default function AchievementCompletionPage() {
  const session = useContext(SessionContext);
  const eventStart = session.eventStart;
  const eventEnd = session.eventEnd;

  const [time, setTime] = useState<number>(Date.now());
  const [scope, animate] = useAnimate();

  useEffect(() => {
    setInterval(() => setTime(Date.now()), 1000);
  }, []); // run once

  const isHidden = time < eventStart;

  const { data: achievements } = useGetAchievements(!isHidden);
  const { data: teams } = useGetTeams();
  const team = getMyTeam(session.user?.id, teams);

  const state = useStateContext();
  const dispatchState = useDispatchStateContext();

  if (state.achievementsFilter === null && achievements !== undefined) {
    dispatchState({ id: 5, achievementsFilter: getDefaultNav(achievements) });
  }

  if (time < eventStart) {
    return (
      <HiddenAchievementCompletionPage time={time} eventStart={eventStart} />
    );
  }

  return (
    <>
      <Helmet>
        <title>CTA - Completions</title>
      </Helmet>

      <div className="achievements-layout">
        <div style={{ margin: "auto", textAlign: "center", marginTop: "20px" }}>
          <h1 style={{ fontSize: "3em" }}>
            {time < eventEnd
              ? `Ends in: ${getTimeStr(eventEnd - time)}`
              : "Event ended"}
          </h1>
        </div>

        <AchievementNavigationBar
          state={state}
          animate={animate}
          dispatchState={dispatchState}
          achievements={achievements}
          isStaff={false}
        />

        <div className="achievements">
          {team !== null ? (
            <FullAchievementCompletionPage
              scope={scope}
              state={state}
              dispatchState={dispatchState}
              team={team}
              hidden={isHidden}
            />
          ) : (
            <LimitedAchievementCompletionPage state={state} scope={scope} />
          )}
        </div>
      </div>
    </>
  );
}
