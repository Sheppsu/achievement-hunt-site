import { AchievementTeamExtendedType } from "api/types/AchievementTeamType.ts";
import { getAnonName } from "util/helperFunctions.ts";
import React from "react";
import Player from "components/team/Player.tsx";

export default function TeamListingsCard({
  teams,
}: {
  teams: AchievementTeamExtendedType[];
}) {
  return (
    <div className="card">
      <h1 className="card__title">All Teams</h1>
      {teams.map((team, idx) => (
        <div key={idx}>
          <p className="card--teams__subtitle">
            {team.name} ({getAnonName(team.id)}) - {team.points}pts
          </p>
          <div className="card--teams__container players">
            {team.players
              .sort(
                (a, b) => (a.team_admin ? 0 : a.id) - (b.team_admin ? 0 : b.id),
              )
              .map((player, i) => (
                <Player key={i} player={player} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
