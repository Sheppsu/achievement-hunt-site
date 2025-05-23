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
import TextCard from "components/cards/TextCard.tsx";

export default function AchievementsIndex() {
  const session = useContext(SessionContext);
  const { data: teams, isLoading: teamsLoading } = useGetTeams();

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

  const cardsColumns = [];

  if (session.user === null) {
    cardsColumns.push(<UnauthenticatedCard />);
  } else if (teamsLoading) {
    cardsColumns.push(<TextCard text="Loading..." />);
  } else if (teams === undefined) {
    cardsColumns.push(<TextCard text="Failed to load teams" />);
  } else if (ownTeam === null) {
    if (session.user.is_admin) {
      cardsColumns.push(
        <>
          <NoTeamCard />
          <TeamListingsCard teams={teams as AchievementTeamExtendedType[]} />
        </>,
      );
    } else {
      cardsColumns.push(<NoTeamCard />);
    }
  } else {
    cardsColumns.push(
      <>
        <TeamCard team={ownTeam} />
        <TeamChatCard />
      </>,
    );
  }

  if (teams !== undefined) {
    cardsColumns.push(<LeaderboardCard teams={teams} />);
  }

  return (
    <>
      <Helmet>
        <title>CTA Teams</title>
      </Helmet>
      <div className="cards-container">
        {cardsColumns.map((cards, i) => (
          <>
            <div className="cards-container__column">{cards}</div>
            {i !== cardsColumns.length - 1 ? (
              <div className="vertical-divider"></div>
            ) : (
              ""
            )}
          </>
        ))}
      </div>
    </>
  );
}
