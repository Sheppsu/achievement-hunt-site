import { AchievementPlayerType } from "api/types/AchievementPlayerType.ts";
import React, { SetStateAction } from "react";
import { FaCrown } from "react-icons/fa6";

export default function Player({
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
        "card--teams__container--players__player-card " +
        (setSelectedPlayer ? "selectable " : "") +
        (selectedPlayer === player ? "selected" : "")
      }
      onClick={() => setSelectedPlayer && setSelectedPlayer(player)}
    >
      <img
        className="card--teams__container--players__player-card__avatar"
        src={player.user.avatar}
        alt=""
      ></img>
      <p className="card--teams__container__text grow">
        {player.user.username}
      </p>
      {player.team_admin && <FaCrown color="yellow" />}
    </div>
  );
}
