import "assets/css/team.css";

import { useGetTeams } from "api/query";
import { AchievementTeamType } from "api/types/AchievementTeamType";

function LeaderboardItem({
  team,
  placement
}: {
  team: AchievementTeamType,
  placement: number
}) {
  return (
    <div>
      <p>#{placement}</p>
      <p>{team.points}pts</p>
    </div>
  );
}

export default function LeaderboardCard() {
  const teamsResp = useGetTeams(true);

  return (
    <div className="card-container lb">
      <div className="info-container">
        <h1 className="info-title">Leaderboard</h1>
        <div className="info-inner-container">
          { 
            teamsResp.isLoading ? (
              "Loading..."
            ) : teamsResp.data === undefined ? (
              "Error loading leaderboard"
            ) : (
              teamsResp.data.map((team, i) => <LeaderboardItem key={i} team={team} placement={i+1} />)
            )
          }
        </div>
      </div>
    </div>
  );
}