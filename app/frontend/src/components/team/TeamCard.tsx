import {
  useLeaveTeam,
  useRenameTeam,
  useTransferTeamAdmin,
} from "api/query.ts";
import React, { FormEvent, useContext, useState } from "react";
import { AchievementPlayerType } from "api/types/AchievementPlayerType.ts";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType.ts";
import "assets/css/form.css";
import "assets/css/team.css";
import { SimplePromptPopup } from "components/popups/PopupContent.tsx";
import { EventContext, EventDispatch } from "contexts/EventContext.ts";
import { PopupContext, PopupContextType } from "contexts/PopupContext.ts";
import { SessionContext } from "contexts/SessionContext.ts";
import { getAnonName } from "util/helperFunctions.ts";
import Player from "components/team/Player.tsx";
import Button from "components/inputs/Button.tsx";

export default function TeamCard({
  team,
}: {
  team: AchievementTeamExtendedType;
}) {
  const session = useContext(SessionContext);
  const dispatchEventMsg = useContext(EventContext);
  const { setPopup } = useContext(PopupContext) as PopupContextType;

  const renameTeam = useRenameTeam();
  const leaveTeam = useLeaveTeam();

  const user = team.players.find(
    (player) => player.user.id === session.user?.id,
  );
  const copyInvite = () => {
    navigator.clipboard.writeText(team.invite);
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
          ownTeam={team}
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
          dispatchEventMsg({
            type: "info",
            msg: `Team ${team.name} successfully renamed to ${name}`,
          });
        },
        onSettled: () => {
          renameTeam.reset();
        },
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
    <div className="card">
      <div className="card--teams__container your-team">
        <p className="card--teams__container__text center grow">
          {team.name} | {getAnonName(team.id)} - {team.points}pts
        </p>
      </div>
      <h1 className="card__title">Players</h1>
      <div className="card--teams__container players">
        {team.players.map((player, i) => (
          <Player key={i} player={player} />
        ))}
      </div>
      <div className="card--teams__container buttons">
        <Button
          children="Leave team"
          onClick={onLeaveTeam}
          unavailable={user?.team_admin && team.players.length > 1}
        />
        <Button children="Invite code" onClick={copyInvite} />
      </div>
      {user?.team_admin && (
        <div className="card--teams__container buttons">
          <Button children="Rename Team" onClick={renameTeamPopup} />
          <Button
            children="Transfer Leadership"
            onClick={transferTeamAdminPopup}
          />
        </div>
      )}
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
      <div className="card--teams__container players">
        {playerList.map((player, i) => (
          <Player
            key={i}
            player={player}
            selectedPlayer={selectedPlayer}
            setSelectedPlayer={setSelectedPlayer}
          />
        ))}
      </div>
      <Button
        children="Submit"
        unavailable={selectedPlayer === undefined}
        onClick={() => onTransferTeamAdmin(selectedPlayer?.user.id as number)}
      />
    </div>
  );
}

// function PlacementCard({
//   placement,
//   numberTeams,
// }: {
//   placement: number;
//   numberTeams: number;
// }) {
//   return (
//     <motion.div
//       className="card"
//       layout
//       initial={{ height: 0, opacity: 0 }}
//       animate={{ height: "auto", opacity: 1 }}
//       exit={{ height: 0, opacity: 0 }}
//     >
//       <div className="card--teams__container placement">
//         <div className="card--teams__container--placement__column">
//           <div className="card--teams__container--placement__column__container">
//             <p className="card--teams__title placement">#{placement}</p>
//           </div>
//           <p className="card--teams__subtitle">Current placement</p>
//         </div>
//         <div className="vertical-divider"></div>
//         <div className="card--teams__container--placement__column">
//           <div className="card--teams__container--placement__column__container">
//             <p className="card--teams__title placement">{numberTeams}</p>
//           </div>
//           <p className="card--teams__subtitle">Registered teams</p>
//         </div>
//       </div>
//     </motion.div>
//   );
// }
