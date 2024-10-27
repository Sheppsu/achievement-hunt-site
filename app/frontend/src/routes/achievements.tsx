import { useGetAchievements, useGetTeams } from "api/query";
import AchievementContainer from "components/achievements/AchievementContainer";
import { useContext, useEffect, useState } from "react";
import { SessionContext } from "contexts/SessionContext";
import { Helmet } from "react-helmet";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType";
import AnimatedPage from "components/AnimatedPage";
import { getMyTeam } from "util/helperFunctions";
import { AnimationScope, useAnimate } from "framer-motion";
import { WebsocketState } from "types/WebsocketStateType.ts";
import {
  StateDispatch,
  useDispatchStateContext,
  useStateContext,
} from "contexts/StateContext.ts";
import "assets/css/achievements.css";
import AchievementProgress from "components/achievements/AchievementProgress.tsx";
import AchievementNavigationBar, {
  getDefaultNav,
} from "components/achievements/AchievementNavigationBar.tsx";

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
  setTime,
  eventStart,
}: {
  time: number;
  setTime: React.Dispatch<React.SetStateAction<number>>;
  eventStart: number;
}) {
  const delta = eventStart - time;
  const timeString = getTimeStr(delta);

  useEffect(() => {
    const intervalId = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(intervalId);
  });

  return (
    <div style={{ margin: "auto", textAlign: "center", marginTop: "20px" }}>
      <Helmet>
        <title>CTA - Starts in {timeString}</title>
      </Helmet>
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
}: {
  team: AchievementTeamExtendedType | null;
  state: WebsocketState;
  scope: AnimationScope;
  dispatchState: StateDispatch;
}) {
  return (
    <>
      <AchievementContainer scope={scope} state={state} />
      <div className="progress-container">
        <AchievementProgress
          state={state}
          dispatchState={dispatchState}
          team={team}
        />
      </div>
    </>
  );
}

export default function AchievementCompletionPage() {
  const session = useContext(SessionContext);
  const eventStart = session.eventStart;
  const eventEnd = session.eventEnd;

  useGetAchievements(false);
  const { data: teams } = useGetTeams();
  const team = getMyTeam(session.user?.id, teams);

  const [time, setTime] = useState<number>(Date.now());
  const [scope, animate] = useAnimate();

  const state = useStateContext();
  const dispatchState = useDispatchStateContext();

  if (time < eventStart && !session.debug) {
    return (
      <HiddenAchievementCompletionPage
        time={time}
        setTime={setTime}
        eventStart={eventStart}
      />
    );
  }

  const { data: achievements } = useGetAchievements(true);
  if (state.achievementsFilter === null && achievements !== undefined) {
    dispatchState({ id: 5, achievementsFilter: getDefaultNav(achievements) });
  }

  useEffect(() => {
    const intervalId = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(intervalId);
  });

  return (
    <AnimatedPage>
      <Helmet>
        <title>CTA - Completions</title>
      </Helmet>

      <div className="page-container">
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
        />

        <div className="achievement-content-container">
          {team !== null ? (
            <FullAchievementCompletionPage
              scope={scope}
              state={state}
              dispatchState={dispatchState}
              team={team}
            />
          ) : (
            <LimitedAchievementCompletionPage state={state} scope={scope} />
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
