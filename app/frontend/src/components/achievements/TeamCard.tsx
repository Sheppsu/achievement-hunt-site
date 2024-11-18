import { FormEvent, useContext, useState } from "react";
import {
  useCreateTeam,
  useGetTeams,
  useJoinTeam,
  useLeaveTeam,
  useRenameTeam,
} from "api/query";

import "assets/css/team.css";
import "assets/css/form.css";
import BaseButton from "components/Button";
import { FaCrown } from "react-icons/fa6";

import { SessionContext } from "contexts/SessionContext";
import { EventContext, EventDispatch } from "contexts/EventContext";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType";
import { AchievementPlayerType } from "api/types/AchievementPlayerType";
import { PopupContext, PopupContextType } from "contexts/PopupContext";
import { AnimatePresence, motion } from "framer-motion";
import { SimplePromptPopup } from "components/popups/PopupContent.tsx";
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

function PlayerCard({ player }: { player: AchievementPlayerType }) {
  return (
    <div className="player-card">
      <img className="player-card-avatar" src={player.user.avatar} alt=""></img>
      <p className="info-inner-text grow">{player.user.username}</p>
      {player.team_admin && <FaCrown color="yellow" />}
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
        onSuccess: () => renameTeam.reset(),
      },
    );

    dispatchEventMsg({
      type: "info",
      msg: `Team ${ownTeam.name} successfully renamed to ${name}`,
    });

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
        <Button text="Leave team" onClick={leaveTeam} />
        <Button text="Invite code" onClick={copyInvite} />
      </div>
      {user?.team_admin && (
        <div className="info-inner-container buttons">
          <Button text="Rename Team" onClick={renameTeamPopup} />
          <Button text="Transfer Admin" />
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
  const { setPopup } = useContext(PopupContext) as PopupContextType;
  const session = useContext(SessionContext);

  const eventEnded = Date.now() >= session.eventEnd;

  const createTeamPopup = () => {
    setPopup({
      title: "Create Team",
      content: <SimplePromptPopup prompt="Team name" onSubmit={createTeam} />,
    });
  };

  const joinTeamPopup = () => {
    setPopup({
      title: "Join team",
      content: <SimplePromptPopup prompt="Invite code" onSubmit={joinTeam} />,
    });
  };

  return (
    <motion.div layout>
      <div className="info-inner-container your-team">
        <p className="info-inner-text">No team</p>
      </div>
      <div className="info-inner-container buttons">
        <Button
          text="Create team"
          onClick={createTeamPopup}
          disabled={eventEnded}
        />
        <Button
          text="Join team"
          onClick={joinTeamPopup}
          disabled={eventEnded}
        />
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

function AdminAllTeams({
  teams,
}: {
  teams: AchievementTeamExtendedType[] | undefined;
}) {
  if (!teams) return;

  return (
    <div className="info-container">
      <p className="info-title center">ADMIN: All Teams</p>
      {teams.map((team, idx) => (
        <div key={idx}>
          <p className="info-subtitle">
            {team.name} | {getAnonName(team.id)}
          </p>
          <div className="info-inner-container players">
            {team.players.map((player, i) => (
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
  const [adminShowTeams, setAdminShowTeams] = useState<boolean>(false);

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
          <NoTeamContent createTeam={onCreateTeam} joinTeam={onJoinTeam} />
        ) : (
          <YourTeamContent
            ownTeam={ownTeam}
            dispatchEventMsg={dispatchEventMsg}
            leaveTeam={onLeaveTeam}
          />
        )}
      </motion.div>
      {session.user?.is_admin && (
        <Button
          text="Toggle Teams List"
          onClick={() => setAdminShowTeams((s) => !s)}
        />
      )}
      {adminShowTeams && (
        <AdminAllTeams
          teams={teams as AchievementTeamExtendedType[] | undefined}
        />
      )}
    </motion.div>
  );
}
