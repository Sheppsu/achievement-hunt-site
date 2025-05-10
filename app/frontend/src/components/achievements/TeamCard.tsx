import {
  useCreateTeam,
  useGetTeams,
  useJoinTeam,
  useLeaveTeam,
  useRenameTeam,
  useTransferTeamAdmin,
} from "api/query";
import { FormEvent, SetStateAction, useContext, useState } from "react";

import "assets/css/form.css";
import "assets/css/team.css";
import BaseButton from "components/inputs/Button.tsx";
import { FaCrown } from "react-icons/fa6";

import { AchievementPlayerType } from "api/types/AchievementPlayerType";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType";
import { SimplePromptPopup } from "components/popups/PopupContent.tsx";
import { EventContext, EventDispatch } from "contexts/EventContext";
import { PopupContext, PopupContextType } from "contexts/PopupContext";
import { SessionContext } from "contexts/SessionContext";
import { AnimatePresence, motion } from "motion/react";
import { BsPeopleFill, BsPlusCircleFill } from "react-icons/bs";
import { getAnonName } from "util/helperFunctions";

function Button({
  text,
  onClick,
  type,
  disabled,
}: {
  text: string;
  onClick?: () => void;
  type?: "submit" | "button" | "reset";
  disabled?: boolean;
}) {
  return (
    <BaseButton
      children={text}
      width="200px"
      type={type}
      onClick={onClick}
      unavailable={disabled ?? false}
    />
  );
}

function PlayerCard({
  player,
  selectedPlayer,
  setSelectedPlayer,
}: {
  player: AchievementPlayerType;
  selectedPlayer?: AchievementPlayerType;
  setSelectedPlayer?: React.Dispatch<
    SetStateAction<AchievementPlayerType | undefined>
  >;
}) {
  return (
    <div
      className={
        "player-card " +
        (setSelectedPlayer ? "player-card-selectable " : "") +
        (selectedPlayer === player ? "player-card-selected" : "")
      }
      onClick={() => setSelectedPlayer && setSelectedPlayer(player)}
    >
      <img className="player-card-avatar" src={player.user.avatar} alt=""></img>
      <p className="info-inner-text grow">{player.user.username}</p>
      {player.team_admin && <FaCrown color="yellow" />}
    </div>
  );
}

function TransferTeamAdminComponent({
  ownTeam,
  dispatchEventMsg,
}: {
  ownTeam: AchievementTeamExtendedType;
  dispatchEventMsg: EventDispatch;
}) {
  const session = useContext(SessionContext);
  const { setPopup } = useContext(PopupContext) as PopupContextType;
  const transferTeamAdmin = useTransferTeamAdmin();
  const [selectedPlayer, setSelectedPlayer] = useState<
    AchievementPlayerType | undefined
  >(undefined);

  const playerList = ownTeam.players.filter(
    (player) => player.user.id !== session.user?.id,
  );

  const onTransferTeamAdmin = (newUserId: number) => {
    transferTeamAdmin.mutate(
      { prevAdminId: session.user?.id, newAdminId: newUserId },
      {
        onSuccess: () => {
          transferTeamAdmin.reset();
          dispatchEventMsg({
            type: "info",
            msg: "Team admin transferred!",
          });
          setPopup(null);
        },
      },
    );
  };

  return (
    <div>
      <p>Select the player to transfer admin to: </p>
      <div className="info-inner-container players">
        {playerList.map((player, i) => (
          <PlayerCard
            key={i}
            player={player}
            selectedPlayer={selectedPlayer}
            setSelectedPlayer={setSelectedPlayer}
          />
        ))}
      </div>
      <Button
        text="Submit"
        disabled={selectedPlayer === undefined}
        onClick={() => onTransferTeamAdmin(selectedPlayer?.user.id as number)}
      />
    </div>
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
  const session = useContext(SessionContext);
  const { setPopup } = useContext(PopupContext) as PopupContextType;

  const renameTeam = useRenameTeam();

  const user = ownTeam.players.find(
    (player) => player.user.id === session.user?.id,
  );
  const copyInvite = () => {
    navigator.clipboard.writeText(ownTeam.invite);
    dispatchEventMsg({
      type: "info",
      msg: "Copied team code to clipboard!",
    });
  };

  const renameTeamPopup = () => {
    setPopup({
      title: "Rename Team",
      content: (
        <SimplePromptPopup prompt="New team name" onSubmit={onRenameTeam} />
      ),
    });
  };

  const transferTeamAdminPopup = () => {
    setPopup({
      title: "Transfer admin",
      content: (
        <TransferTeamAdminComponent
          ownTeam={ownTeam}
          dispatchEventMsg={dispatchEventMsg}
        />
      ),
    });
  };

  const onRenameTeam = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    const name = new FormData(evt.currentTarget).get("prompt-value") as string;
    if (name.length < 1 || name.length > 32) {
      return dispatchEventMsg({
        type: "error",
        msg: "Team name must be between 1 and 32 characters",
      });
    }

    renameTeam.mutate(
      { name },
      {
        onSuccess: () => {
          renameTeam.reset();
          dispatchEventMsg({
            type: "info",
            msg: `Team ${ownTeam.name} successfully renamed to ${name}`,
          });
        },
      },
    );

    setPopup(null);
  };

  return (
    <>
      <div className="info-inner-container your-team">
        <p className="info-inner-text center grow">
          {ownTeam.name} | {getAnonName(ownTeam.id)} - {ownTeam.points}pts
        </p>
      </div>
      <h1 className="info-title">Players</h1>
      <div className="info-inner-container players">
        {ownTeam.players.map((player, i) => (
          <PlayerCard key={i} player={player} />
        ))}
      </div>
      <div className="info-inner-container buttons">
        <Button
          text="Leave team"
          onClick={leaveTeam}
          disabled={user?.team_admin && ownTeam.players.length > 1}
        />
        <Button text="Invite code" onClick={copyInvite} />
      </div>
      {user?.team_admin && (
        <div className="info-inner-container buttons">
          <Button text="Rename Team" onClick={renameTeamPopup} />
          <Button text="Transfer Index" onClick={transferTeamAdminPopup} />
        </div>
      )}
    </>
  );
}

function NoTeamContent({
  createTeam,
  joinTeam,
}: {
  createTeam: (evt: FormEvent<HTMLFormElement>) => void;
  joinTeam: (evt: FormEvent<HTMLFormElement>) => void;
}) {
  const { setPopup } = useContext(PopupContext)!;
  const session = useContext(SessionContext);

  const eventEnded = Date.now() >= session.eventEnd;

  return (
    <motion.div layout style={{ height: "100%" }}>
      <div className="no-team-container">
        <div className="no-team-container-item">
          <div />
          <BsPlusCircleFill size={75} />
          <Button text="Create a Team" disabled={eventEnded} />
        </div>
        <div className="horizontal-divider"></div>
        <div className="no-team-container-item">
          <div />
          <BsPeopleFill size={100} />
          <Button text="Join a Team" disabled={eventEnded} />
        </div>
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

function AllTeams({
  teams,
}: {
  teams: AchievementTeamExtendedType[] | undefined;
}) {
  if (!teams) return;

  return (
    <div className="info-container">
      <p className="info-title center">All Teams</p>
      {teams.map((team, idx) => (
        <div key={idx}>
          <p className="info-subtitle">
            {team.name} ({getAnonName(team.id)}) - {team.points}pts
          </p>
          <div className="info-inner-container players">
            {team.players
              .sort(
                (a, b) => (a.team_admin ? 0 : a.id) - (b.team_admin ? 0 : b.id),
              )
              .map((player, i) => (
                <PlayerCard key={i} player={player} />
              ))}
          </div>
        </div>
      ))}
    </div>
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
  const [showTeams, setShowTeams] = useState<boolean>(false);

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

    const name = new FormData(evt.currentTarget).get("prompt-value") as string;
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
      },
    );

    dispatchEventMsg({
      type: "info",
      msg: `Team '${name}' successfully created!`,
    });

    setPopup(null);
  };

  const onJoinTeam = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    const invite = new FormData(evt.currentTarget).get(
      "prompt-value",
    ) as string;
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
      },
    );

    setPopup(null);
  };

  const onLeaveTeam = () => {
    leaveTeam.mutate(
      {},
      {
        onSuccess: () => leaveTeam.reset(),
      },
    );
  };

  const canSeeTeams =
    teams === undefined
      ? false
      : teams.filter((t) => "players" in t && t.players.length > 0).length > 1;

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
        {!session.isAuthenticated ? (
          <UnauthenticatedContent />
        ) : teamsResponse.isLoading ? (
          <LoadingContent />
        ) : ownTeam === null ? (
          <NoTeamContent createTeam={onCreateTeam} joinTeam={onJoinTeam} />
        ) : (
          <YourTeamContent
            ownTeam={ownTeam}
            dispatchEventMsg={dispatchEventMsg}
            leaveTeam={onLeaveTeam}
          />
        )}
      </motion.div>
      {canSeeTeams && (
        <Button
          text="Toggle Teams List"
          onClick={() => setShowTeams((s) => !s)}
        />
      )}
      {showTeams && (
        <AllTeams teams={teams as AchievementTeamExtendedType[] | undefined} />
      )}
    </motion.div>
  );
}
