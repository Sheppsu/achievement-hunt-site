import Achievement from "./Achievement";
import { useGetAchievements } from "api/query";
import { AchievementExtendedType } from "api/types/AchievementType";
import "assets/css/achievements.css";
import { WebsocketState } from "./AchievementProgress";
import { NavItem } from "routes/achievements";
import { AnimationScope } from "framer-motion";

export default function AchievementContainer({
  state,
  scope,
}: {
  state: WebsocketState;
  scope: AnimationScope;
}) {
  const { data: achievements } = useGetAchievements();

  const activeCategories = Array.from(
    getActiveCategories(state.achievementsFilter.categories)
  );

  const sortedAchievements: { [key: string]: AchievementExtendedType[] } = {};
  if (achievements !== undefined) {
    for (const achievement of achievements as AchievementExtendedType[]) {
      if (state.achievementsSearchFilter != "") {
        const categoryName = `Search for ${state.achievementsSearchFilter}`;
        if (!sortedAchievements[categoryName]) {
          sortedAchievements[categoryName] = [];
        }

        if (
          achievement.name
            .toLowerCase()
            .includes(state.achievementsSearchFilter.toLowerCase())
        ) {
          sortedAchievements[categoryName].push(achievement);
        }
      } else if (
        activeCategories.includes(achievement.category) ||
        activeCategories.length == 0
      ) {
        if (!sortedAchievements[achievement.category]) {
          sortedAchievements[achievement.category] = [];
        }
        sortedAchievements[achievement.category].push(achievement);
      }
    }
  }

  function* getActiveCategories(categories: NavItem[]) {
    for (const category of categories) {
      if (category.active) {
        yield category.label;
      }
    }
  }

  return (
    <div ref={scope} className="achievements-container">
      {achievements !== undefined ? (
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
                    <Achievement key={index} achievement={achievement} />
                  ))
                )}
              </>
            );
          })
      ) : (
        <div>Loading achievements...</div>
      )}
    </div>
  );
}
