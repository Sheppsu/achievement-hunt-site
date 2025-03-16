import Achievement from "./Achievement";
import { useGetAchievements, useGetTeams } from "api/query";
import { CompletedAchievementType } from "api/types/AchievementType";
import "assets/css/achievements.css";
import { AnimationScope } from "framer-motion";
import {
  calculateScore,
  getMyCompletion,
  getMyTeam,
} from "util/helperFunctions.ts";
import { useContext } from "react";
import { SessionContext } from "contexts/SessionContext.ts";
import { WebsocketState } from "types/WebsocketStateType.ts";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType.ts";
import { getSortedAchievements } from "util/achievementSorting.ts";

function extendAchievementData(
  achievements: CompletedAchievementType[],
  nTeams: number,
  myTeam: AchievementTeamExtendedType | null,
) {
  for (const achievement of achievements) {
    const completion = getMyCompletion(achievement.completions, myTeam);

    achievement.completed = completion !== null;

    if (
      achievement.tags.split(",").includes("competition") &&
      completion === null
    )
      continue;

    achievement.points = calculateScore(
      nTeams,
      completion === null ||
        completion.placement === undefined ||
        completion.placement === null
        ? achievement.completion_count
        : completion.placement.place,
      achievement.completed,
    );
  }
}

export default function AchievementContainer({
  state,
  scope,
}: {
  state: WebsocketState;
  scope: AnimationScope;
}) {
  const session = useContext(SessionContext);
  const { data: baseAchievements } = useGetAchievements();
  const { data: teams } = useGetTeams();

  if (
    state.achievementsFilter === null ||
    baseAchievements === undefined ||
    teams === undefined
  )
    return (
      <div ref={scope} className="achievements-container">
        <div>Loading achievements...</div>
      </div>
    );

  const nTeams = teams.filter((t) => t.points > 0).length;
  const achievements: CompletedAchievementType[] = baseAchievements.map(
    (a) => ({
      ...a,
      completed: false,
      points: null,
    }),
  );

  const myTeam = getMyTeam(session.user?.id ?? undefined, teams);

  extendAchievementData(achievements, nTeams, myTeam);

  const sortedAchievements = getSortedAchievements(
    achievements,
    state.achievementsFilter,
    state.achievementsSearchFilter,
    state.mode,
    state.hideCompletedAchievements,
    myTeam,
  );

  return (
    <div ref={scope} className="achievements-container">
      {Object.entries(sortedAchievements).map(([group, achievements]) => {
        return (
          <>
            <div className="achievement-category">{group}</div>
            {group.toLowerCase().includes("search") &&
            achievements.length === 0 ? (
              <p>No achievements found!</p>
            ) : (
              achievements.map((achievement, index) => (
                <Achievement
                  key={index}
                  achievement={achievement}
                  completed={achievement.completed}
                  points={achievement.points}
                  state={state}
                />
              ))
            )}
          </>
        );
      })}
    </div>
  );
}
