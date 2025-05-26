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
  const { data: teamData, isLoading: teamsLoading } = useGetTeams();

  // look for the current user's team
  let ownTeam: AchievementTeamExtendedType | null = null;
  if (teamData !== undefined)
    for (const [i, team] of teamData.teams.entries()) {
      if ("players" in team) {
        for (const player of team.players) {
          if (player.user.id === session.user?.id) {
            ownTeam = team as AchievementTeamExtendedType;
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
  } else if (teamData === undefined || registration === undefined) {
    cardsColumns[0].push(<TextCard text="Failed to load" />);
  } else if (registration === null) {
    cardsColumns[0].push(<RegisterButton registered={false} />);
  } else if (ownTeam === null) {
    cardsColumns[0].push(
      <RegisterButton registered={true} />,
      <NoTeamCard registration={registration} />,
    );
  } else {
    cardsColumns[0].push(<TeamCard team={ownTeam} />, <TeamChatCard />);
  }

  cardsColumns.push([<AnnouncementsCard />]);

  if (teamData !== undefined && teamData.teams.length > 0) {
    cardsColumns[1].push(
      <LeaderboardCard placement={teamData.placement} teams={teamData.teams} />,
    );
  }

  // show teams listing for admins
  // if (
  //   session.user !== null &&
  //   session.user.is_admin &&
  //   teamData !== undefined
  // ) {
  //   cardsColumns[0].push(
  //     <TeamListingsCard
  //       teams={teamData.teams as AchievementTeamExtendedType[]}
  //     />,
  //   );
  // }

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
              <div className="card-vertical-divider"></div>
            ) : (
              ""
            )}
          </>
        ))}
      </div>
    </>
  );
}
