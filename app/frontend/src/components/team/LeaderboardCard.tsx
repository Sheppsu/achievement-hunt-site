import "assets/css/team.css";

import { AchievementTeamType } from "api/types/AchievementTeamType.ts";

export default function LeaderboardCard({
  teams,
  placement,
}: {
  teams: AchievementTeamType[];
  placement: number;
}) {
  const enumOffset = placement <= 1 ? 2 : placement;

  return (
    <div className="card">
      <h1 className="card__title">Leaderboard</h1>
      <p style={{ textAlign: "left", marginLeft: "20px" }}>
        Updates hourly. Real-time score is on your team card.
      </p>
      <div className="card--teams__container leaderboard">
        {teams.map((team, i) => (
          <div key={team.id}>
            <p>
              #{enumOffset + i - 1}: {team.anonymous_name}
            </p>
            <p>{team.points}pts</p>
          </div>
        ))}
      </div>
    </div>
  );
}
