import { FormEvent, useContext } from "react";
import {
  useCreateTeam,
  useGetTeams,
  useJoinTeam,
  useLeaveTeam,
} from "api/query";
import { Helmet } from "react-helmet";

import "assets/css/team.css";
import Button from "components/Button";

import { SessionContext } from "contexts/SessionContext";
import { EventContext } from "contexts/EventContext";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType";

export default function TeamCard() {
  const session = useContext(SessionContext);
  const dispatchEventMsg = useContext(EventContext);

  const teamsResponse = useGetTeams();
  const teams = teamsResponse.data;

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

  const leaveTeam = useLeaveTeam();
  const joinTeam = useJoinTeam();
  const createTeam = useCreateTeam();

  const onCreateTeam = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    const name = new FormData(evt.currentTarget).get("name") as string;
    if (name.length < 1 || name.length > 32) {
      return dispatchEventMsg({
        type: "error",
        msg: "Team name must be between 1 and 32 characters",
      });
    }

    createTeam.mutate(
      { name },
      {
        onSuccess: () => createTeam.reset(),
      }
    );
  };

  const onJoinTeam = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    const invite = new FormData(evt.currentTarget).get("code") as string;
    if (invite === "") {
      return dispatchEventMsg({
        type: "error",
        msg: "Input an invite code first",
      });
    }

    joinTeam.mutate(
      { invite },
      {
        onSuccess: () => joinTeam.reset(),
      }
    );
  };

  const onLeaveTeam = () => {
    leaveTeam.mutate(
      {},
      {
        onSuccess: () => leaveTeam.reset(),
      }
    );
  };

  const copyInvite = () => {
    navigator.clipboard.writeText((ownTeam as AchievementTeamExtendedType).invite);
    dispatchEventMsg({
      type: "info",
      msg: "Copied team code to clipboard!",
    });
  };

  return (
    <div className="info-container">
      <Helmet>
        <title>CTA Teams + Info</title>
      </Helmet>
      <h1 className="info-title">Your team</h1>
      <div className="info-inner-container your-team">
        {session.isAuthenticated == false ? (
          <p className="info-inner-text">Not authenticated.</p>
        ) : teamsResponse.isLoading ? (
          <p className="info-inner-text">Loading...</p>
        ) : ownTeam === null ? (
          <p className="info-inner-text">No team</p>
        ) : (
          <>
            <p className="info-inner-text grow">{ownTeam.name}</p>
            <div className="vertical-divider"></div>
            <p className="info-inner-text">{ownTeam.points}<span>pts</span></p>
          </>
        )}
      </div>
      <h1 className="info-title">Players</h1>
      <div className="info-inner-container"></div>
    </div>
  );
}
