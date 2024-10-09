import Achievement from "./Achievement";
import {useGetAchievements, useGetTeams} from "api/query";
import { AchievementExtendedType } from "api/types/AchievementType";
import "assets/css/achievements.css";
import { WebsocketState } from "./AchievementProgress";
import { AnimationScope } from "framer-motion";
import {getMyTeam} from "util/helperFunctions.ts";
import {useContext} from "react";
import {SessionContext} from "contexts/SessionContext.ts";

function intersects(a: string[], b: string[]): boolean {
  for (const item of b) {
    if (a.includes(item)) {
      return true;
    } 
  }

  return false;
}

function matchesSearch(achievement: AchievementExtendedType, searchFilter: string[]) {
  for (const word of searchFilter) {
    const bm = achievement.beatmap;
    if (
      word != "" &&
      !achievement.name.toLowerCase().includes(word) &&
      !achievement.description.toLowerCase().includes(word) &&
      !(bm === null ? false : bm.artist.toLowerCase().includes(word)) &&
      !(bm === null ? false : bm.title.toLowerCase().includes(word)) &&
      !(bm === null ? false : bm.version.toLowerCase().includes(word))
    )
      return false;
  }

  return true;
}

type CompletedAchievementType = AchievementExtendedType & { completed: boolean };

export default function AchievementContainer({
  state,
  scope,
}: {
  state: WebsocketState;
  scope: AnimationScope;
}) {
  const session = useContext(SessionContext);
  const { data: baseAchievements } = useGetAchievements();
  const { data: teams } = useGetTeams()

  if (state.achievementsFilter === null || baseAchievements === undefined || teams === undefined)
    return (
      <div ref={scope} className="achievements-container">
        <div>Loading achievements...</div>
      </div>
    );

  const achievements: CompletedAchievementType[] = baseAchievements.map(
    (a) => ({...a, completed: false})
  );

  const myTeam = session.user === null ? null : getMyTeam(session.user.id, teams);

  if (myTeam !== null) {
    const teamUserIds = myTeam.players.map((p) => p.user.id);
    for (const achievement of achievements) {
      achievement.completed = achievement.completions.filter(
        (c) => teamUserIds.includes(c.player.user.id)
      ).length > 0;
    }
  }

  const activeCategories = state.achievementsFilter.categories
    .filter((item) => item.active)
    .map((item) => item.label);
  const activeTags = state.achievementsFilter.tags
    .filter((item) => item.active)
    .map((item) => item.label);
  const searchFilter = state.achievementsSearchFilter.toLowerCase().split(" ");

  const sortedAchievements: { [key: string]: CompletedAchievementType[] } = {};

  for (const achievement of achievements) {
    if (!matchesSearch(achievement, searchFilter))
      continue;

    if (!activeCategories.includes(achievement.category))
      continue;

    if (!intersects(activeTags, achievement.tags.split(",")))
      continue;

    if (state.hideCompletedAchievements && achievement.completed)
      continue;

    if (!sortedAchievements[achievement.category])
      sortedAchievements[achievement.category] = [];
    sortedAchievements[achievement.category].push(achievement);
  }

  return (
    <div ref={scope} className="achievements-container">
      {
        Object.keys(sortedAchievements)
          .sort((a, b) => a.localeCompare(b))
          .map((key) => {
            return (
              <>
                <div className="achievement-category">{key}</div>
                {key.toLowerCase().includes("search") &&
                sortedAchievements[key].length === 0 ? (
                  <p>No achievements found!</p>
                ) : (
                  sortedAchievements[key].map((achievement, index) => (
                    <Achievement
                      key={index}
                      achievement={achievement}
                      completed={achievement.completed}
                      state={state}
                    />
                  ))
                )}
              </>
            );
          })
      }
    </div>
  );
}
