import "assets/css/team.css";

import { useGetTeams } from "api/query.ts";
import { getAnonName } from "util/helperFunctions.ts";

export default function LeaderboardCard() {
  const teamsResp = useGetTeams(true);

  return (
    <div className="cards-container__column teams">
      <div className="card fill">
        <h1 className="card--teams__title">Leaderboard</h1>
        <div className="card--teams__container leaderboard">
          {teamsResp.isLoading
            ? "Loading..."
            : teamsResp.data === undefined
              ? "Error loading leaderboard"
              : teamsResp.data.map((team, i) => (
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
