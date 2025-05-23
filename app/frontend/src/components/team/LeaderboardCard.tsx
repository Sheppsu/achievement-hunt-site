import "assets/css/team.css";

import { useGetTeams } from "api/query.ts";
import { getAnonName } from "util/helperFunctions.ts";
import { AchievementTeamType } from "api/types/AchievementTeamType.ts";

export default function LeaderboardCard({
  teams,
}: {
  teams: AchievementTeamType[];
}) {
  return (
    <div className="cards-container__column teams">
      <div className="card fill">
        <h1 className="card--teams__title">Leaderboard</h1>
        <div className="card--teams__container leaderboard">
          {teams.map((team, i) => (
            <>
              <p>
                #{i + 1}: {getAnonName(team.id)}
              </p>
              <p>{team.points}pts</p>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
