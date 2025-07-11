import { AchievementTeamExtendedType } from "api/types/AchievementTeamType.ts";
import React, { useState } from "react";
import Player from "components/team/Player.tsx";
import Button from "components/inputs/Button.tsx";
import classNames from "classnames";

export default function TeamListingsCard({
  teams,
}: {
  teams: AchievementTeamExtendedType[];
}) {
  const [showTeams, setShowTeams] = useState(false);

  return (
    <div className="card">
      <h1 className="card__title">All Teams</h1>
      <Button
        children={showTeams ? "Hide" : "Show"}
        onClick={() => setShowTeams(!showTeams)}
      />
      <div
        className={classNames("card--all-teams__container", {
          hide: !showTeams,
        })}
      >
        {teams.map((team, idx) => (
          <div key={idx}>
            <p className="card--teams__subtitle">
              {team.name} ({team.anonymous_name}) - {team.points}pts
            </p>
            <div className="card--teams__container players">
              {team.players
                .sort(
                  (a, b) =>
                    (a.team_admin ? 0 : a.id) - (b.team_admin ? 0 : b.id),
                )
                .map((player, i) => (
                  <Player key={i} player={player} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
