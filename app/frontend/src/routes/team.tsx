import AnimatedPage from "components/AnimatedPage";
import TeamCard from "components/team/TeamCard.tsx";
import LeaderboardCard from "components/team/LeaderboardCard.tsx";
import { Helmet } from "react-helmet";
import { motion } from "motion/react";
import TeamChatCard from "components/team/TeamChatCard.tsx";
import "assets/css/team.css";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType.ts";
import { useGetTeams } from "api/query.ts";
import { useContext } from "react";
import { SessionContext } from "contexts/SessionContext.ts";
import UnauthenticatedCard from "components/team/UnauthenticatedCard.tsx";
import NoTeamCard from "components/team/NoTeamCard.tsx";
import TeamListingsCard from "components/team/TeamListingsCard.tsx";

function LoadingCard() {
  return (
    <div className="card">
      <p className="card--teams__title">Loading...</p>
    </div>
  );
}

export default function AchievementsIndex() {
  const session = useContext(SessionContext);
  const { data: teams } = useGetTeams();

  let ownTeam: AchievementTeamExtendedType | null = null;
  let ownPlacement: number | null = null;
  if (Array.isArray(teams))
    for (const [i, team] of teams.entries()) {
      if ("players" in team) {
        for (const player of team.players) {
          if (player.user.id === session.user?.id) {
            ownTeam = team as AchievementTeamExtendedType;
            ownPlacement = i + 1;
          }
        }
      }
    }

  let teamCards;
  if (session.user === null) {
    teamCards = <UnauthenticatedCard />;
  } else if (teams === undefined) {
    teamCards = <LoadingCard />;
  } else if (ownTeam === null) {
    if (session.user.is_admin) {
      teamCards = (
        <>
          <NoTeamCard />
          <TeamListingsCard teams={teams as AchievementTeamExtendedType[]} />
        </>
      );
    } else {
      teamCards = <NoTeamCard />;
    }
  } else {
    teamCards = <TeamCard team={ownTeam} />;
  }

  return (
    <>
      <Helmet>
        <title>CTA Teams</title>
      </Helmet>
      <AnimatedPage>
        <div className="cards-container">
          <motion.div layout className="cards-container__column teams">
            {teamCards}
          </motion.div>
          <div className="vertical-divider"></div>
          <LeaderboardCard />
        </div>
      </AnimatedPage>
    </>
  );
}
