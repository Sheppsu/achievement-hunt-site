import { useGetAchievements, useGetIteration, useGetTeams } from "api/query";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType";
import { EventIterationType } from "api/types/EventIterationType.ts";
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

function LimitedAchievementCompletionPage({ state }: { state: AppState }) {
  return <AchievementContainer state={state} />;
}

function FullAchievementCompletionPage({
  team,
  state,
  iteration,
}: {
  team: AchievementTeamExtendedType | null;
  state: AppState;
  iteration: EventIterationType;
}) {
  return (
    <>
      <AchievementProgress team={team} iteration={iteration} />
      <AchievementContainer state={state} />
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

  useEffect(() => {
    setInterval(() => setTime(Date.now()), 1000);
  }, []); // run once

  const { data: iteration, isLoading: iterationLoading } = useGetIteration();

  const iterationStart =
    iteration !== undefined ? Date.parse(iteration.start) : null;
  const showContent = iterationStart !== null && iterationStart < time;

  const { data: teamData, isLoading: teamsLoading } = useGetTeams(showContent);
  const team =
    teamData === undefined ? null : getMyTeam(session.user?.id, teamData.teams);
  const fetchAchievements =
    showContent &&
    (team !== null ||
      (session.user !== null &&
        (session.user.is_admin || session.user.is_achievement_creator)));
  const { data: achievements, isLoading: achievementsLoading } =
    useGetAchievements(fetchAchievements);

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

  if (team === null && Date.parse(iteration.end) > time && !fetchAchievements) {
    return (
      <TextPage text="You must be playing to view the achievements while the event is ongoing." />
    );
  }

  if (
    (fetchAchievements && achievements === undefined) ||
    teamData == undefined
  ) {
    return <TextPage text="Failed to load" />;
  }

  if (state.achievementsFilter === null && achievements !== undefined) {
    dispatchState({ id: 5, achievementsFilter: getDefaultNav(achievements) });
  }

  const iterationEnd = Date.parse(iteration.end);

  return (
    <>
      <Helmet>
        <title>CTA - Achievements</title>
      </Helmet>

      <div className="achievements-layout">
        <div style={{ margin: "auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "3em" }}>
            {time < iterationEnd
              ? `Ends in: ${getTimeStr(iterationEnd - time)}`
              : "Event ended"}
          </h1>
        </div>

        <AchievementNavigationBar
          key="achievements"
          state={state}
          dispatchState={dispatchState}
          achievements={achievements}
          isStaff={false}
        />

        <div className="achievements">
          {team !== null ? (
            <FullAchievementCompletionPage
              state={state}
              team={team}
              iteration={iteration}
            />
          ) : (
            <LimitedAchievementCompletionPage state={state} />
          )}
        </div>
      </div>
    </>
  );
}
