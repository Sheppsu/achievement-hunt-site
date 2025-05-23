import TeamCard from "components/team/TeamCard.tsx";
import LeaderboardCard from "components/team/LeaderboardCard.tsx";
import { Helmet } from "react-helmet";
import TeamChatCard from "components/team/TeamChatCard.tsx";
import "assets/css/team.css";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType.ts";
import { useGetRegistration, useGetTeams } from "api/query.ts";
import { useContext } from "react";
import { SessionContext } from "contexts/SessionContext.ts";
import UnauthenticatedCard from "components/team/UnauthenticatedCard.tsx";
import NoTeamCard from "components/team/NoTeamCard.tsx";
import TeamListingsCard from "components/team/TeamListingsCard.tsx";
import TextCard from "components/cards/TextCard.tsx";
import RegisterButton from "components/team/RegisterButton.tsx";
import AnnouncementsCard from "components/team/AnnouncementsCard.tsx";

export default function AchievementsIndex() {
  const session = useContext(SessionContext);
  const { data: registration, isLoading: registrationLoading } =
    useGetRegistration();
  const { data: teams, isLoading: teamsLoading } = useGetTeams();

  // look for the current user's team
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

  // show different layout of cards depending on current user state
  const cardsColumns: React.ReactNode[][] = [[]];

  if (session.user === null) {
    cardsColumns[0].push(<UnauthenticatedCard />);
  } else if (teamsLoading || registrationLoading) {
    cardsColumns[0].push(<TextCard text="Loading..." />);
  } else if (teams === undefined || registration === undefined) {
    cardsColumns[0].push(<TextCard text="Failed to load" />);
  } else if (!registration.registered) {
    cardsColumns[0].push(<RegisterButton registered={false} />);
  } else if (ownTeam === null) {
    cardsColumns[0].push(
      <RegisterButton registered={registration.registered} />,
      <NoTeamCard />,
    );
  } else {
    cardsColumns[0].push(<TeamCard team={ownTeam} />, <TeamChatCard />);
  }

  cardsColumns.push([<AnnouncementsCard />]);

  if (teams !== undefined && teams.length > 0) {
    cardsColumns[1].push(<LeaderboardCard teams={teams} />);
  }

  // show teams listing for admins
  if (session.user !== null && session.user.is_admin && teams !== undefined) {
    cardsColumns[0].push(
      <TeamListingsCard teams={teams as AchievementTeamExtendedType[]} />,
    );
  }

  return (
    <>
      <Helmet>
        <title>CTA Teams</title>
      </Helmet>
      <div className="cards-container">
        {cardsColumns.map((cards, i) => (
          <>
            <div className="cards-container__column teams">{cards}</div>
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
