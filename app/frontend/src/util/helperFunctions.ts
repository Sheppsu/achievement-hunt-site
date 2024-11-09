import {
  AchievementTeamExtendedType,
  AchievementTeamType,
} from "api/types/AchievementTeamType.ts";

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

export function calculateScore(
  teams: number,
  completions: number,
  isCompleted: boolean,
) {
  if (teams == 1) return 100;
  if (isCompleted) completions -= 1;

  const c0 = -Math.atanh(0.7);
  const c1 = Math.atanh(0.97);

  const a = (x: number) => (1 - Math.tanh(x)) / 2;
  const b = (x: number) => (a((c1 - c0) * x + c0) - a(c1)) / (a(c0) - a(c1));
  const f = (x: number) => 10 + 90 * b(x / (teams - 1));

  return Math.round(Math.max(f(completions), f(teams - 1)));
}
