import TeamCard from "components/team/TeamCard.tsx";
import LeaderboardCard from "components/team/LeaderboardCard.tsx";
import { Helmet } from "react-helmet";
import TeamChatCard from "components/team/TeamChatCard.tsx";
import "assets/css/team.css";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType.ts";
import { useGetIteration, useGetRegistration, useGetTeams } from "api/query.ts";
import { useContext } from "react";
import { SessionContext } from "contexts/SessionContext.ts";
import UnauthenticatedCard from "components/team/UnauthenticatedCard.tsx";
import NoTeamCard from "components/team/NoTeamCard.tsx";
import TeamListingsCard from "components/team/TeamListingsCard.tsx";
import TextCard from "components/cards/TextCard.tsx";
import RegistrationCard from "components/team/RegistrationCard.tsx";
import AnnouncementsCard from "components/team/AnnouncementsCard.tsx";
import { getMyTeam } from "util/helperFunctions.ts";
import AllRegistrationsCard from "components/team/AllRegistrationsCard.tsx";

export default function TeamPage() {
  const session = useContext(SessionContext);
  const { data: registration, isLoading: registrationLoading } =
    useGetRegistration(session.user !== null);
  const { data: teamData, isLoading: teamsLoading } = useGetTeams(
    session.user !== null,
  );
  const { data: iteration, isLoading: iterationLoading } = useGetIteration(
    session.user !== null,
  );

  const isStaff =
    session.user !== null &&
    (session.user.is_admin || session.user.is_achievement_creator);

  // look for the current user's team
  let ownTeam: AchievementTeamExtendedType | null = null;
  if (teamData !== undefined && session.user !== null)
    ownTeam = getMyTeam(session.user.id, teamData.teams);

  // show different layout of cards depending on current user state
  const cardsColumns: React.ReactNode[][] = [[], []];

  if (session.user === null) {
    // not logged in
    cardsColumns[0].push(<UnauthenticatedCard />);
  } else if (teamsLoading || registrationLoading || iterationLoading) {
    // requests in progress
    cardsColumns[0].push(<TextCard text="Loading..." />);
  } else if (
    teamData === undefined ||
    registration === undefined ||
    iteration === undefined
  ) {
    // something went wrong with requests
    cardsColumns[0].push(<TextCard text="Failed to load" />);
  } else if (ownTeam === null) {
    cardsColumns[0].push(
      <RegistrationCard iteration={iteration} registration={registration} />,
    );
    if (registration !== null && Date.parse(iteration.start) > Date.now()) {
      cardsColumns[0].push(<NoTeamCard registration={registration} />);
    }
  } else {
    cardsColumns[0].push(<TeamCard team={ownTeam} />, <TeamChatCard />);
  }

  if (
    session.user !== null &&
    iteration !== undefined &&
    Date.parse(iteration.registration_end) > Date.now()
  ) {
    cardsColumns[1].push(<AllRegistrationsCard />);
  }

  cardsColumns[1].push(<AnnouncementsCard />);

  if (teamData !== undefined && teamData.teams.length > 0) {
    cardsColumns[1].push(
      <LeaderboardCard placement={teamData.placement} teams={teamData.teams} />,
    );
  }

  // show teams listing for admins
  // or at the end of the event
  if (
    (isStaff ||
      (iteration !== undefined && Date.parse(iteration.end) <= Date.now())) &&
    teamData !== undefined
  ) {
    cardsColumns[0].push(
      <TeamListingsCard
        teams={teamData.teams as AchievementTeamExtendedType[]}
      />,
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
