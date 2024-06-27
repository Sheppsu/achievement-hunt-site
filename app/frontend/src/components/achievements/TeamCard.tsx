import {
  AchievementTeamExtendedType,
  AchievementTeamType,
} from "api/types/AchievementTeamType";
import "assets/css/achievements/teams.css";

export default function TeamCard({
  team,
  hidePlayers = true,
  placement,
}: {
  team: AchievementTeamType | AchievementTeamExtendedType;
  hidePlayers?: boolean;
  placement?: number;
}) {
  return (
    <div className="teams-card-container">
      <div className="teams-card-info-container">
        <p className={`teams-placement n${placement}`}>{placement}</p>
        <p className="teams-team-name">{team.name}</p>
        <p className="teams-points">{team.points}</p>
      </div>
      {hidePlayers
        ? ""
        : (team as AchievementTeamExtendedType).players.map((player) => (
            <div className="teams-card-player">
              <img
                src={player.user.avatar}
                className="teams-card-player-image"
              />
              <p className="teams-card-player-text">
                {player.user.username}
              </p>
            </div>
          ))}
    </div>
  );
}
