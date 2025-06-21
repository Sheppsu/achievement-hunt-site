import { useGetAchievements, useGetTeams } from "api/query";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType.ts";
import { CompletedAchievementType } from "api/types/AchievementType";
import "assets/css/achievements.css";
import { SessionContext } from "contexts/SessionContext.ts";
import { useContext } from "react";
import { AppState } from "types/AppStateType.ts";
import { getSortedAchievements } from "util/achievementSorting.ts";
import {
  calculateScore,
  getMyCompletion,
  getMyTeam,
} from "util/helperFunctions.ts";
import Achievement from "./Achievement";

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

export default function AchievementContainer({ state }: { state: AppState }) {
  const session = useContext(SessionContext);
  const { data: baseAchievements } = useGetAchievements();
  const { data: teamData } = useGetTeams();

  if (
    state.achievementsFilter === null ||
    baseAchievements === undefined ||
    teamData === undefined
  )
    return (
      <div className="achievements__container">
        <div>Loading achievements...</div>
      </div>
    );

  const teams = teamData.teams;

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
    state.hideCompletedAchievements,
    myTeam,
  );

  return (
    <div className="achievements__container">
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
