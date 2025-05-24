import { useGetAchievements, useGetIteration, useGetTeams } from "api/query";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType";
import "assets/css/achievements.css";
import AchievementContainer from "components/achievements/AchievementContainer";
import AchievementNavigationBar, {
  getDefaultNav,
} from "components/achievements/AchievementNavigationBar.tsx";
import AchievementProgress from "components/achievements/AchievementProgress.tsx";
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
  state: AppState;
  scope: AnimationScope;
}) {
  return <AchievementContainer scope={scope} state={state} />;
}

function FullAchievementCompletionPage({
  team,
  state,
  scope,
  hidden,
}: {
  team: AchievementTeamExtendedType | null;
  state: AppState;
  scope: AnimationScope;
  hidden: boolean;
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

function TextPage({ text }: { text: string }) {
  return (
    <div className="achievements-layout">
      <h1>{text}</h1>
    </div>
  );
}

export default function AchievementCompletionPage() {
  const session = useContext(SessionContext);

  const [time, setTime] = useState<number>(Date.now());
  const [scope, animate] = useAnimate();

  useEffect(() => {
    setInterval(() => setTime(Date.now()), 1000);
  }, []); // run once

  const { data: iteration, isLoading: iterationLoading } = useGetIteration();

  const iterationStart =
    iteration !== undefined ? Date.parse(iteration.start) : null;
  const showContent = iterationStart !== null && iterationStart < time;

  const { data: achievements, isLoading: achievementsLoading } =
    useGetAchievements(showContent);
  const { data: teams, isLoading: teamsLoading } = useGetTeams(showContent);

  const state = useStateContext();
  const dispatchState = useDispatchStateContext();

  if (iterationLoading || achievementsLoading || teamsLoading) {
    return <TextPage text="Loading..." />;
  }

  if (iteration === undefined) {
    return <TextPage text="Failed to load" />;
  }

  if (!showContent) {
    return (
      <HiddenAchievementCompletionPage
        time={time}
        eventStart={iterationStart!}
      />
    );
  }

  if (achievements === undefined || teams == undefined) {
    return <TextPage text="Failed to load" />;
  }

  const team = getMyTeam(session.user?.id, teams);

  if (state.achievementsFilter === null) {
    dispatchState({ id: 5, achievementsFilter: getDefaultNav(achievements) });
  }

  const iterationEnd = Date.parse(iteration.end);

  return (
    <>
      <Helmet>
        <title>CTA - Completions</title>
      </Helmet>

      <div className="achievements-layout">
        <div style={{ margin: "auto", textAlign: "center", marginTop: "20px" }}>
          <h1 style={{ fontSize: "3em" }}>
            {time < iterationEnd
              ? `Ends in: ${getTimeStr(iterationEnd - time)}`
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
              hidden={!showContent}
            />
          ) : (
            <LimitedAchievementCompletionPage state={state} scope={scope} />
          )}
        </div>
      </div>
    </>
  );
}
