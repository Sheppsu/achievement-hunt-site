import "assets/css/team.css";

import { useGetTeams } from "api/query.ts";
import { getAnonName } from "util/helperFunctions.ts";
import { AchievementTeamType } from "api/types/AchievementTeamType.ts";

export default function LeaderboardCard({
  teams,
  placement,
}: {
  teams: AchievementTeamType[];
  placement: number;
}) {
  if (placement === 0) {
    placement = 2;
  }

  return (
    <div className="card">
      <h1 className="card__title">Leaderboard</h1>
      <div className="card--teams__container leaderboard">
        {teams.map((team, i) => (
          <div key={team.id}>
            <p>
              #{placement + i - 1}: {getAnonName(team.id)}
            </p>
            <p>{team.points}pts</p>
          </div>
        ))}
      </div>
    </div>
  );
}
