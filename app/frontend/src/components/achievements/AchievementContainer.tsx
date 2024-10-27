import Achievement from "./Achievement";
import { useGetAchievements, useGetTeams } from "api/query";
import { AchievementExtendedType } from "api/types/AchievementType";
import "assets/css/achievements.css";
import { AnimationScope } from "framer-motion";
import { getMyTeam } from "util/helperFunctions.ts";
import { useContext } from "react";
import { SessionContext } from "contexts/SessionContext.ts";
import { WebsocketState } from "types/WebsocketStateType.ts";
import { NavItems } from "components/achievements/AchievementNavigationBar.tsx";
import {
  AchievementCompletionType,
  AnonymousAchievementCompletionType,
} from "api/types/AchievementCompletionType.ts";

function intersects(a: string[], b: string[]): boolean {
  for (const item of b) {
    if (a.includes(item)) {
      return true;
    }
  }

  return false;
}

function matchesSearch(
  achievement: AchievementExtendedType,
  searchFilter: string[],
) {
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

function matchesMode(
  achievement: AchievementExtendedType,
  mode: number,
): boolean {
  for (const tag of achievement.tags.split(",")) {
    if (tag.startsWith("mode-"))
      return ["o", "t", "f", "m"].indexOf(tag[tag.length - 1]) == mode;
  }

  return true;
}

function getGrouping(
  sort: string,
): [
  string[],
  (a: CompletedAchievementType) => string,
  (a: CompletedAchievementType, b: CompletedAchievementType) => number,
] {
  const getMyCompletion = (
    cs: (AchievementCompletionType | AnonymousAchievementCompletionType)[],
  ) => {
    for (const c of cs) {
      if ("player" in c) {
        return c;
      }
    }

    return null;
  };

  const getTimestamp = (
    cs: (AchievementCompletionType | AnonymousAchievementCompletionType)[],
  ): number => {
    const c = getMyCompletion(cs);
    return c === null ? 0 : Date.parse(c.time_completed);
  };

  const getTimeGroup = (a: CompletedAchievementType): string => {
    const timestamp = getTimestamp(a.completions);
    const timeAgo = (Date.now() - timestamp) / 1000;
    if (timeAgo < 60 * 60) return "Past hour";
    else if (timeAgo < 60 * 60 * 24) return "Past 24 hours";
    else if (timeAgo < 60 * 60 * 24 * 3) return "Past 3 days";
    else if (timeAgo < 60 * 60 * 24 * 7) return "Past week";
    else return "Over a week ago";
  };

  switch (sort) {
    case "category":
      return [["*"], (a) => a.category, (a, b) => a.name.localeCompare(b.name)];
    case "completions":
      return [
        ["1+ completion(s)", "No completions"],
        (a) => (a.completion_count > 0 ? "1+ completion(s)" : "No completions"),
        (a, b) => a.completion_count - b.completion_count,
      ];
    case "player":
      return [
        ["*", "Not completed"],
        (a) =>
          a.completed
            ? getMyCompletion(a.completions)!.player.user.username
            : "Not completed",
        (a, b) => a.name.localeCompare(b.name),
      ];
    case "date completed":
      return [
        ["*", "Not completed"],
        (a) => (a.completed ? getTimeGroup(a) : "Not completed"),
        (a, b) => getTimestamp(a.completions) - getTimestamp(b.completions),
      ];
    default:
      throw new Error(
        "unexpected sort type, was there a typo? missing a sort type?",
      );
  }
}

type CompletedAchievementType = AchievementExtendedType & {
  completed: boolean;
};

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

  const filters = state.achievementsFilter as NavItems;

  const achievements: CompletedAchievementType[] = baseAchievements.map(
    (a) => ({ ...a, completed: false }),
  );

  const myTeam =
    session.user === null ? null : getMyTeam(session.user.id, teams);

  if (myTeam !== null) {
    const teamUserIds = myTeam.players.map((p) => p.user.id);
    for (const achievement of achievements) {
      achievement.completed =
        achievement.completions.filter(
          (c) => "player" in c && teamUserIds.includes(c.player.user.id),
        ).length > 0;
    }
  }

  const activeCategories = filters.categories
    .filter((item) => item.active)
    .map((item) => item.label);
  const activeTags = filters.tags
    .filter((item) => item.active)
    .map((item) => item.label);
  const searchFilter = state.achievementsSearchFilter.toLowerCase().split(" ");

  const sort = filters.sort.filter((i) => i.active)[0].label;
  const [groupSort, groupFunc, sortFunc] = getGrouping(sort);
  const sortedAchievements: { [key: string]: CompletedAchievementType[] } = {};

  for (const achievement of achievements) {
    if (!matchesMode(achievement, state.mode)) continue;

    if (!matchesSearch(achievement, searchFilter)) continue;

    if (
      activeCategories.length != 0 &&
      !activeCategories.includes(achievement.category)
    )
      continue;

    if (
      activeTags.length != 0 &&
      !intersects(activeTags, achievement.tags.split(","))
    )
      continue;

    if (state.hideCompletedAchievements && achievement.completed) continue;

    // get group to put this achievement into
    const group = groupFunc(achievement);
    if (!(group in sortedAchievements)) sortedAchievements[group] = [];

    // insert into group sorted
    let i = 0;
    const items = sortedAchievements[group];
    while (i < items.length && sortFunc(achievement, items[i]) > 0) {
      i += 1;
    }
    sortedAchievements[group] = items
      .slice(0, i)
      .concat([achievement], items.slice(i, items.length));
  }

  const getGroupIndex = (group: string) => {
    const i = groupSort.indexOf(group);
    return i == -1 ? groupSort.indexOf("*") : i;
  };

  const sortGroups = (g1: string, g2: string) => {
    const i1 = getGroupIndex(g1);
    const i2 = getGroupIndex(g2);
    return i1 == i2 ? g1.localeCompare(g2) : i1 - i2;
  };

  return (
    <div ref={scope} className="achievements-container">
      {Object.keys(sortedAchievements)
        .sort(sortGroups)
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
        })}
    </div>
  );
}
