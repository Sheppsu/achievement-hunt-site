import { useGetAchievements, useGetTeams } from "api/query";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType.ts";
import { CompletedAchievementType } from "api/types/AchievementType";
import "assets/css/achievements.css";
import { SessionContext } from "contexts/SessionContext.ts";
import { useContext, useMemo } from "react";
import { AppState } from "types/AppStateType.ts";
import { getSortedAchievements } from "util/achievementSorting.ts";
import {
  calculateScore,
  getMyCompletion,
  getMyTeam,
  parseMeaningfulTags,
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

    if (!achievement.worth_points) {
      achievement.points = 0;
      continue;
    }

    const [isCompetition, isSecret] = parseMeaningfulTags(achievement.tags);

    if (isCompetition && completion === null) continue;

    if (completion === null) {
      achievement.points = calculateScore(
        nTeams,
        achievement.completion_count + 1,
        achievement.completion_count + 1,
        isSecret,
      );
    } else {
      if (isCompetition) {
        achievement.points = calculateScore(
          nTeams,
          completion.placement!.place,
          0,
          false,
        );
      } else {
        achievement.points = calculateScore(
          nTeams,
          achievement.completion_count,
          completion.time_placement,
          isSecret,
        );
      }
    }
  }
}

export default function AchievementContainer({ state }: { state: AppState }) {
  const session = useContext(SessionContext);
  const { data: baseAchievements } = useGetAchievements();
  const { data: teamData } = useGetTeams();

  const teams = useMemo(
    () => (teamData === undefined ? null : teamData.teams),
    [teamData],
  );
  const myTeam = useMemo(
    () =>
      teams === null ? null : getMyTeam(session.user?.id ?? undefined, teams),
    [teams, session.user],
  );

  const achievements = useMemo(() => {
    if (
      baseAchievements === undefined ||
      teamData === undefined ||
      myTeam === null
    ) {
      return null;
    }
    const ach = baseAchievements.map((a) => ({
      ...a,
      completed: false,
      points: null,
    }));
    extendAchievementData(ach, teamData.effective_team_count, myTeam);
    return ach;
  }, [baseAchievements, teamData, myTeam]);

  const sortedAchievements = useMemo(() => {
    if (achievements === null || state.achievementsFilter === null) {
      return null;
    }
    return getSortedAchievements(
      achievements,
      state.achievementsFilter,
      state.achievementsSearchFilter,
      state.hideCompletedAchievements,
      myTeam,
    );
  }, [
    achievements,
    state.achievementsFilter,
    state.achievementsSearchFilter,
    state.hideCompletedAchievements,
    myTeam,
  ]);

  if (
    state.achievementsFilter === null ||
    sortedAchievements === null ||
    teamData === undefined
  )
    return (
      <div className="achievements__container">
        <div>Loading achievements...</div>
      </div>
    );

  return (
    <div className="achievements__container">
      {Object.entries(sortedAchievements).map(([group, achievements]) => {
        if (state.hideCompletedAchievements) {
          achievements = achievements.filter(
            (achievement) => !achievement.completed,
          );
        }
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
                />
              ))
            )}
          </>
        );
      })}
    </div>
  );
}
