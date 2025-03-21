import {
  AchievementType,
  CompletedAchievementType,
  StaffAchievementType,
} from "api/types/AchievementType.ts";
import {
  AchievementCompletionType,
  AnonymousAchievementCompletionType,
} from "api/types/AchievementCompletionType.ts";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType.ts";
import { getMyCompletion } from "util/helperFunctions.ts";
import { NavItems } from "components/achievements/AchievementNavigationBar.tsx";

function intersects(a: string[], b: string[]): boolean {
  for (const item of b) {
    if (a.includes(item)) {
      return true;
    }
  }

  return false;
}

function matchesSearch(achievement: AchievementType, searchFilter: string[]) {
  for (const word of searchFilter) {
    if (
      word != "" &&
      !achievement.name.toLowerCase().includes(word) &&
      !achievement.description.toLowerCase().includes(word) &&
      achievement.beatmaps.filter(
        (bm) =>
          bm.info.artist.toLowerCase().includes(word) ||
          bm.info.title.toLowerCase().includes(word) ||
          bm.info.version.toLowerCase().includes(word),
      ).length == 0
    )
      return false;
  }

  return true;
}

function matchesMode(
  achievement: AchievementType,
  mode: number,
  exclusive: boolean,
): boolean {
  for (const tag of achievement.tags.split(",")) {
    if (tag.startsWith("mode-"))
      return ["o", "t", "f", "m"].indexOf(tag[tag.length - 1]) == mode;
  }

  return !exclusive;
}

function getGrouping(
  sort: string,
  myTeam: AchievementTeamExtendedType | null,
): [
  string[],
  (
    | ((a: CompletedAchievementType) => string)
    | ((a: StaffAchievementType) => string)
  ),
  (
    | ((a: CompletedAchievementType, b: CompletedAchievementType) => number)
    | ((a: StaffAchievementType, b: StaffAchievementType) => number)
  ),
] {
  const getTimestamp = (
    cs: (AchievementCompletionType | AnonymousAchievementCompletionType)[],
  ): number => {
    const c = getMyCompletion(cs, myTeam);
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

  const getLastActive = (a: StaffAchievementType): number => {
    return Math.max(
      Date.parse(a.last_edited_at),
      ...a.comments.map((c) => Date.parse(c.posted_at)),
    );
  };

  switch (sort) {
    case "completions":
      return [
        ["1+ completion(s)", "No completions"],
        (a: CompletedAchievementType) =>
          a.completion_count > 0 ? "1+ completion(s)" : "No completions",
        (a: CompletedAchievementType, b: CompletedAchievementType) =>
          a.completion_count - b.completion_count,
      ];
    case "player":
      return [
        ["*", "Not completed"],
        (a: CompletedAchievementType) =>
          a.completed
            ? getMyCompletion(a.completions, myTeam)!.player.user.username
            : "Not completed",
        (a: CompletedAchievementType, b: CompletedAchievementType) =>
          b.name.localeCompare(a.name),
      ];
    case "date completed":
      return [
        [
          "Past hour",
          "Past 24 hours",
          "Past 3 days",
          "Past week",
          "Over a week ago",
          "Not completed",
        ],
        (a: CompletedAchievementType) =>
          a.completed ? getTimeGroup(a) : "Not completed",
        (a: CompletedAchievementType, b: CompletedAchievementType) =>
          getTimestamp(a.completions) - getTimestamp(b.completions),
      ];
    case "batch":
      return [
        [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `Batch ${n}`),
        (a: CompletedAchievementType) =>
          `Batch ${Math.ceil(Math.max(0, a.id - 30) / 10) + 1}`,
        (a: CompletedAchievementType, b: CompletedAchievementType) =>
          a.id - b.id,
      ];
    case "votes":
      return [
        ["*"],
        () => "values",
        (a: StaffAchievementType, b: StaffAchievementType) =>
          a.vote_count - b.vote_count,
      ];
    case "creation time":
      return [
        ["*"],
        () => "values",
        (a: AchievementType, b: AchievementType) =>
          Date.parse(a.created_at) - Date.parse(b.created_at),
      ];
    case "last active":
      return [
        ["*"],
        () => "values",
        (a: StaffAchievementType, b: StaffAchievementType) =>
          getLastActive(a) - getLastActive(b),
      ];
    default:
      throw new Error(
        "unexpected sort type, was there a typo? missing a sort type?",
      );
  }
}

export function getSortedAchievements<T extends AchievementType>(
  achievements: T[],
  filters: NavItems,
  searchText: string,
  mode: number | null = null,
  hideCompletedAchievements: boolean = false,
  team: AchievementTeamExtendedType | null = null,
  exclusiveModeFiltering: boolean = false,
): { [_k: string]: T[] } {
  const activeTags = filters.rows.tags.items
    .filter((item) => item.active)
    .map((item) => item.label);
  const searchFilter = searchText.toLowerCase().split(" ");
  const sort = filters.rows.sort.items.filter((i) => i.active)[0].label;

  const [groupSort, groupFunc, sortFunc] = getGrouping(sort, team);
  const sortedAchievements: { [key: string]: T[] } = {};

  for (const achievement of achievements) {
    if (mode != null && !matchesMode(achievement, mode, exclusiveModeFiltering))
      continue;

    if (!matchesSearch(achievement, searchFilter)) continue;

    if (
      activeTags.length != 0 &&
      !intersects(activeTags, achievement.tags.split(","))
    )
      continue;

    if (
      hideCompletedAchievements &&
      "completed" in achievement &&
      achievement.completed
    )
      continue;

    // get group to put this achievement into
    // @ts-ignore
    const group = groupFunc(achievement);
    if (!(group in sortedAchievements)) sortedAchievements[group] = [];

    // create sort function based on current sort direction
    const directionalSortFunc: (a: T, b: T) => boolean =
      filters.rows.sort.sort === "desc"
        ? // @ts-ignore
          (a, b) => sortFunc(a, b) < 0
        : // @ts-ignore
          (a, b) => sortFunc(a, b) > 0;

    // insert achievements into groups sorted
    let i = 0;
    const items = sortedAchievements[group];
    while (i < items.length && directionalSortFunc(achievement, items[i])) {
      i += 1;
    }
    sortedAchievements[group] = items
      .slice(0, i)
      .concat([achievement], items.slice(i, items.length));
  }

  const getGroupIndex = (group: string) => {
    let i = groupSort.indexOf(group);
    return i == -1 ? groupSort.indexOf("*") : i;
  };

  const sortGroups = (g1: string, g2: string) => {
    const i1 = getGroupIndex(g1);
    const i2 = getGroupIndex(g2);
    if (filters.rows.sort.sort === "desc")
      return i1 == i2 ? g1.localeCompare(g2) : i1 - i2;
    return i1 == i2 ? g2.localeCompare(g1) : i2 - i1;
  };

  return Object.fromEntries(
    Object.keys(sortedAchievements)
      .sort(sortGroups)
      .map((k) => [k, sortedAchievements[k]]),
  );
}
