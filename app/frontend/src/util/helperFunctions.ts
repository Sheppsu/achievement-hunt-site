import {
  AchievementTeamExtendedType,
  AchievementTeamType,
} from "api/types/AchievementTeamType.ts";
import {
  AchievementCompletionType,
  AnonymousAchievementCompletionType,
} from "api/types/AchievementCompletionType.ts";

export function toTitleCase(str: string) {
  switch (str) {
    case "pfc":
      return "PFC";
    case "pp":
      return "PP";
    default:
      return str.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
  }
}

export function timeAgo(timestamp: string) {
  const times: [number, string][] = [
    [60, "minute"],
    [60, "hour"],
    [24, "day"],
  ];
  const now = Date.now();
  const completion = Date.parse(timestamp);

  let leftover1 = Math.round((now - completion) / 1000);
  let label1 = "second";
  let leftover2: number | null = null;
  let label2: string | null = null;
  for (const [div, label] of times) {
    if (leftover1 < div) {
      break;
    }

    leftover2 = leftover1 % div;
    label2 = label1;
    leftover1 = Math.floor(leftover1 / div);
    label1 = label;
  }

  if (leftover1 !== 1) {
    label1 += "s";
  }

  if (leftover2 === null) {
    return `${leftover1} ${label1} ago`;
  }

  if (leftover2 !== 1) {
    label2 += "s";
  }

  return `${leftover1} ${label1} ${leftover2} ${label2} ago`;
}

export function dateToText(timestamp: string) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const date = new Date(Date.parse(timestamp));
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()} (${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")} UTC)`;
}

export function getMyTeam(
  userId: number | undefined,
  teams?: Array<AchievementTeamExtendedType | AchievementTeamType>,
): AchievementTeamExtendedType | null {
  if (userId === undefined) {
    return null;
  }

  if (teams !== undefined)
    for (const team of teams) {
      if ("players" in team) {
        for (const player of team.players) {
          if (player.user.id === userId) {
            return team as AchievementTeamExtendedType;
          }
        }
      }
    }

  return null;
}

export function getMyCompletion(
  cs: (AchievementCompletionType | AnonymousAchievementCompletionType)[],
  myTeam: AchievementTeamExtendedType | null,
) {
  if (myTeam === null) return null;

  const playerIds = myTeam.players.map((p) => p.user.id);

  for (const c of cs) {
    if ("player" in c && playerIds.includes(c.player.user.id)) {
      return c;
    }
  }

  return null;
}

const c0 = -Math.atanh(0.7);
const c1 = Math.atanh(0.97);

export function calculateScore(
  teams: number,
  completions: number,
  timePlacement: number,
  isSecret: boolean,
) {
  if (teams == 1) return 100;

  const a = (x: number) => (1 - Math.tanh(x)) / 2;
  const b = (x: number) => (a((c1 - c0) * x + c0) - a(c1)) / (a(c0) - a(c1));
  const f = (x: number) => 10 + 90 * b(x / (teams - 1));
  const p = (x: number) => Math.max(f(x - 1), f(teams - 1));
  const s = (x: number) =>
    (Math.cos((4 * Math.PI * (x - 1)) / (5 * teams)) + 1) / 2;

  if (isSecret) {
    return Math.max(Math.round(p(timePlacement) * s(completions)), 10);
  }

  return Math.round(p(completions));
}

function* cleanTags(tags: string) {
  for (let tag of tags.split(",")) {
    tag = tag.trim().toLowerCase();
    if (tag === "") {
      continue;
    }

    yield tag;
  }
}

const modeMap: { [_k: string]: string } = {
  "mode-o": "standard",
  "mode-t": "taiko",
  "mode-f": "catch",
  "mode-m": "mania",
};

export function parseTags(tags: string, includeMode: boolean = true): string[] {
  let mode: string | null = null;
  const filteredTags: string[] = [];
  for (let tag of cleanTags(tags)) {
    if (tag.startsWith("mode-")) {
      mode = modeMap[tag];
      continue;
    }

    if (filteredTags.includes(tag)) {
      continue;
    }

    filteredTags.push(tag);
  }

  if (!includeMode) {
    return filteredTags;
  }

  return [`Mode: ${mode ?? "any"}`].concat(filteredTags);
}

export function parseMode(tags: string): string {
  for (const tag of cleanTags(tags)) {
    const mode = modeMap[tag];
    if (mode !== undefined) {
      return tag;
    }
  }

  return "any";
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sortedConcat<T>(
  arr: T[],
  item: T,
  compFunc: (a: T, b: T) => number,
): T[] {
  for (const [i, existingItem] of arr.entries()) {
    const comp = compFunc(existingItem, item);
    if (comp === 0) return arr;

    if (comp > 0) {
      return arr.slice(0, i).concat([item], arr.slice(i));
    }
  }

  arr.push(item);
  return arr;
}
