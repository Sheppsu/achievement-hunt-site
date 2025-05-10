import "assets/css/team.css";

import { useGetTeams } from "api/query";
import { getAnonName } from "util/helperFunctions.ts";

export default function LeaderboardCard() {
  const teamsResp = useGetTeams(true);

  return (
    <div className="card-container teams">
      <div className="info-container">
        <h1 className="info-title">Leaderboard</h1>
        <div className="info-inner-container leaderboard">
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
