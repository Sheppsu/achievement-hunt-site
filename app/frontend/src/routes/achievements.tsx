import { useGetAchievements, useGetTeams } from "api/query";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType";
import "assets/css/achievements.css";
import classNames from "classnames";
import AchievementContainer from "components/achievements/AchievementContainer";
import AchievementNavigationBar, {
  getDefaultNav,
} from "components/achievements/AchievementNavigationBar.tsx";
import AchievementProgress from "components/achievements/AchievementProgress.tsx";
import AnimatedPage from "components/AnimatedPage";
import { SessionContext } from "contexts/SessionContext";
import {
  useDispatchStateContext,
  useStateContext,
} from "contexts/StateContext.ts";
import { AnimationScope, useAnimate } from "motion/react";
import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { AppState } from "types/AppStateType.ts";
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
  hidden,
}: {
  time: number;
  eventStart: number;
  hidden: boolean;
}) {
  const delta = eventStart - time;
  const timeString = getTimeStr(delta);

  return (
    <div
      className={classNames({ hide: hidden })}
      style={{ margin: "auto", textAlign: "center", marginTop: "20px" }}
    >
      <h1 style={{ fontSize: "3em" }}>Starts in {timeString}</h1>
    </div>
  );
}

function LimitedAchievementCompletionPage({
  state,
  scope,
}: {
  state: AppState;
  scope: AnimationScope;
}) {
  return <AchievementContainer scope={scope} state={state} />;
}

function FullAchievementCompletionPage({
  team,
  state,
  scope,
}: {
  team: AchievementTeamExtendedType | null;
  state: AppState;
  scope: AnimationScope;
}) {
  return (
    <>
      <AchievementContainer scope={scope} state={state} />
      <div className="achievements-progress">
        <AchievementProgress team={team} />
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
    const intervalId = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(intervalId);
  });

  const isHidden = time < eventStart && !session.debug;

  const { data: achievements } = useGetAchievements(!isHidden);
  const { data: teams } = useGetTeams();
  const team = getMyTeam(session.user?.id, teams);

  const state = useStateContext();
  const dispatchState = useDispatchStateContext();

  if (state.achievementsFilter === null && achievements !== undefined) {
    dispatchState({ id: 5, achievementsFilter: getDefaultNav(achievements) });
  }

  return (
    <AnimatedPage>
      <Helmet>
        <title>CTA - Completions</title>
      </Helmet>

      <HiddenAchievementCompletionPage
        time={time}
        eventStart={eventStart}
        hidden={!isHidden}
      />

      <div className={classNames("achievements-layout", { hide: isHidden })}>
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
