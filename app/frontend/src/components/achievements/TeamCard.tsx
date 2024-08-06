import { FormEvent, ReactNode, useContext } from "react";
import {
  useCreateTeam,
  useGetTeams,
  useJoinTeam,
  useLeaveTeam,
} from "api/query";

import "assets/css/team.css";
import "assets/css/form.css";
import BaseButton from "components/Button";

import { SessionContext } from "contexts/SessionContext";
import { EventContext, EventDispatch } from "contexts/EventContext";
import {
  AchievementTeamExtendedType,
} from "api/types/AchievementTeamType";
import { AchievementPlayerExtendedType } from "api/types/AchievementPlayerType";
import { PopupContext, PopupContextType } from "contexts/PopupContext";
import { AnimatePresence, motion } from "framer-motion";

function Button({
  text,
  onClick,
  type,
}: {
  text: string;
  onClick?: () => void;
  type?: "submit" | "button" | "reset";
}) {
  return (
    <BaseButton children={text} width="200px" type={type} onClick={onClick} />
  );
}

function PlayerCard({ player }: { player: AchievementPlayerExtendedType }) {
  return (
    <div className="player-card">
      <img className="player-card-avatar" src={player.user.avatar}></img>
      <p className="info-inner-text grow">{player.user.username}</p>
    </div>
  );
}

function CreateTeamPopup({
  createTeam,
}: {
  createTeam: (evt: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={createTeam}>
      <div className="form-container">
        <div className="input-container">
          <p>Team name: </p>
          <input type="text" name="name" autoComplete="off" />
        </div>
        <div className="input-container center">
          <Button type="submit" text="Create Team" />
        </div>
      </div>
    </form>
  );
}

function YourTeamContent({
  ownTeam,
  dispatchEventMsg,
  leaveTeam,
}: {
  ownTeam: AchievementTeamExtendedType;
  dispatchEventMsg: EventDispatch;
  leaveTeam: () => void;
}) {
  const copyInvite = () => {
    navigator.clipboard.writeText(
      (ownTeam as AchievementTeamExtendedType).invite
    );
    dispatchEventMsg({
      type: "info",
      msg: "Copied team code to clipboard!",
    });
  };

  return (
    <>
      <div className="info-inner-container your-team">
        <p className="info-inner-text grow">{ownTeam.name}</p>
        <div className="vertical-divider"></div>
        <p className="info-inner-text">
          {ownTeam.points}
          <span>pts</span>
        </p>
      </div>
      <h1 className="info-title">Players</h1>
      <div className="info-inner-container players">
        {ownTeam.players.map((player, i) => (
          <PlayerCard key={i} player={player} />
        ))}
      </div>
      <div className="info-inner-container buttons">
        <Button text="Leave team" onClick={leaveTeam} />
        <Button text="Invite code" onClick={copyInvite} />
      </div>
    </>
  );
}

function NoTeamContent({
  createTeam,
}: {
  createTeam: (evt: FormEvent<HTMLFormElement>) => void;
}) {
  const { setPopup } = useContext(PopupContext) as PopupContextType;
  return (
    <motion.div layout>
      <div className="info-inner-container your-team">
        <p className="info-inner-text">No team</p>
      </div>
      <div className="info-inner-container buttons">
        <Button
          text="Create team"
          onClick={() => {
            setPopup({
              title: "Create Team",
              content: <CreateTeamPopup createTeam={createTeam} />,
            });
          }}
        />
        <Button text="Join team" onClick={() => {}} />
      </div>
    </motion.div>
  );
}

function LoadingContent() {
  return (
    <motion.div layout className="info-inner-container your-team">
      <p className="info-inner-text">Loading...</p>
    </motion.div>
  );
}

function UnauthenticatedContent() {
  return (
    <motion.div layout className="info-inner-container your-team">
      <p className="info-inner-text">Not authenticated.</p>
    </motion.div>
  );
}

function PlacementCard({
  placement,
  numberTeams,
}: {
  placement: number;
  numberTeams: number;
}) {
  return (
    <motion.div
      className="info-container"
      layout
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    >
      <div className="info-inner-container placement">
        <div className="placement-section">
          <div className="placement-title-container">
            <p className="info-title placement">#{placement}</p>
          </div>
          <p className="info-subtitle">Current placement</p>
        </div>
        <div className="vertical-divider"></div>
        <div className="placement-section">
          <div className="placement-title-container">
            <p className="info-title placement">{numberTeams}</p>
          </div>
          <p className="info-subtitle">Registered teams</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function TeamCard() {
  const session = useContext(SessionContext);
  const dispatchEventMsg = useContext(EventContext);
  const { setPopup } = useContext(PopupContext) as PopupContextType;

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

    dispatchEventMsg({
      type: "info",
      msg: `Team '${name}' successfully created!`,
    });

    setPopup(null);
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

  return (
    <motion.div layout className="card-container teams">
      <AnimatePresence>
        {ownTeam && (
          <PlacementCard
            placement={ownPlacement as number}
            numberTeams={(teams as Array<any>).length}
          />
        )}
      </AnimatePresence>
      <motion.div className="info-container" layout>
        <h1 className="info-title">Your team</h1>
        {!session.isAuthenticated ? (
          <UnauthenticatedContent />
        ) : teamsResponse.isLoading ? (
          <LoadingContent />
        ) : ownTeam === null ? (
          <NoTeamContent createTeam={onCreateTeam} />
        ) : (
          <YourTeamContent
            ownTeam={ownTeam}
            dispatchEventMsg={dispatchEventMsg}
            leaveTeam={onLeaveTeam}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
