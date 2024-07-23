import { useGetAchievements, useGetTeams } from "api/query";
import AchievementContainer from "components/achievements/AchievementContainer";
import AchievementLeaderboard from "components/achievements/AchievementLeaderboard";
import AchievementProgress, {
  WebsocketState,
} from "components/achievements/AchievementProgress";

import "assets/css/achievements.css";
import { useContext, useEffect, useState } from "react";
import { SessionContext } from "contexts/SessionContext";
import { Helmet } from "react-helmet";
import {
  AchievementTeamExtendedType,
  AchievementTeamType,
} from "api/types/AchievementTeamType";
import AnimatedPage from "components/AnimatedPage";

const EVENT_START = 1720573205000;
export const EVENT_END = 2720600000000;

function getMyTeam(
  userId: number | undefined,
  teams?: Array<AchievementTeamExtendedType | AchievementTeamType>
): AchievementTeamExtendedType | null {
  if (userId === undefined) {
    return null;
  }

  if (teams !== undefined)
    for (const team of teams) {
      if ("players" in team) {
        for (const player of team.players) {
          if (player.user.id === userId) {
            return team as AchievementTeamExtendedType;
          }
        }
      }
    }

  return null;
}

function getTimeStr(delta: number) {
  const days = Math.floor((delta / (1000 * 60 * 60 * 24)) % 60);
  const hours = Math.floor((delta / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((delta / (1000 * 60)) % 60);
  const seconds = Math.floor((delta / 1000) % 60);
  const timeString = [days, hours, minutes, seconds]
    .map((n) => (n < 10 ? "0" + n : "" + n))
    .join(":");
  return timeString;
}

function HiddenAchievementCompletionPage({ time }: { time: number }) {
  const delta = EVENT_START - time;
  const timeString = getTimeStr(delta);

  return (
    <div style={{ margin: "auto", textAlign: "center", marginTop: "20px" }}>
      <Helmet>
        <title>{timeString}</title>
      </Helmet>
      <h1 style={{ fontSize: "1em" }}>Starts in {timeString}</h1>
    </div>
  );
}

function LimitedAchievementCompletionPage() {
  return (
    <div className="page-container">
      <Helmet>
        <title>OCAH Achievements</title>
      </Helmet>
      <AchievementContainer />
      <div className="progress-container">
        <AchievementLeaderboard />
      </div>
    </div>
  );
}

function FullAchievementCompletionPage({
  team,
  state,
  setState,
}: {
  team: AchievementTeamExtendedType | null;
  state: WebsocketState | null;
  setState: React.Dispatch<React.SetStateAction<WebsocketState | null>>;
}) {
  return (
    <div className="page-container">
      <Helmet>
        <title>OCAH Achievements</title>
      </Helmet>
      <AchievementContainer />
      <div className="progress-container">
        <AchievementProgress state={state} setState={setState} team={team} />
        <AchievementLeaderboard />
      </div>
    </div>
  );
}

export default function AchievementCompletionPage() {
  const session = useContext(SessionContext);

  useGetAchievements(false);
  const { data: teams } = useGetTeams();
  const team = getMyTeam(session.user?.id, teams);

  const [time, setTime] = useState<number>(Date.now());
  const [state, setState] = useState<WebsocketState | null>(null);

  useEffect(() => {
    const intervalId = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(intervalId);
  });

  if (time < EVENT_START && !session.debug) {
    return <HiddenAchievementCompletionPage time={time} />;
  }

  return (
    <AnimatedPage>
      <div style={{ margin: "auto", textAlign: "center", marginTop: "20px" }}>
        <h1 style={{ fontSize: "3em" }}>
          {time < EVENT_END
            ? `Ends in: ${getTimeStr(EVENT_END - time)}`
            : "Event ended"}
        </h1>
      </div>
      {team !== null ? (
        <FullAchievementCompletionPage
          state={state}
          setState={setState}
          team={team}
        />
      ) : (
        <LimitedAchievementCompletionPage />
      )}
    </AnimatedPage>
  );
}
