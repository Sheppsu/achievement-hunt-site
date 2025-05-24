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
  return `${months[date.getUTCMonth() - 1]} ${date.getUTCDay()} (${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")} UTC)`;
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

const anonymousNames = [
  "Jagged Bone",
  "Glorious Ball",
  "Treasured Performance",
  "Trusting Telephone",
  "Clear-Cut Nature",
  "Ragged Teach",
  "Elliptical Industry",
  "Testy Culture",
  "Yummy Brother",
  "Fine Handle",
  "Useless Summer",
  "Imperfect Stock",
  "Icy King",
  "Playful Reflection",
  "Somber Peak",
  "Stale Machine",
  "Exhausted Fortune",
  "Reasonable Action",
  "Rubbery Recommendation",
  "Faint Breakfast",
  "Front Tale",
  "Grubby Being",
  "Wiry Reaction",
  "Nimble East",
  "Torn News",
  "Musty Native",
  "Ample Suit",
  "Cloudy Result",
  "Demanding Contract",
  "Pleased Shock",
  "Unruly Mix",
  "Sardonic Condition",
  "Low Garage",
  "Visible Strategy",
  "Whopping Fall",
  "Scaly Reason",
  "Truthful Bid",
  "Disfigured Meal",
  "Impure Public",
  "General Virus",
  "Fluffy Actor",
  "Ill Regular",
  "Imaginary Black",
  "Dry Back",
  "Generous Run",
  "Cautious Taste",
  "Electric Sector",
  "Last Throat",
  "Prestigious Normal",
  "Pastel Climate",
  "Lonely Use",
  "Firsthand Foot",
  "Solid Perspective",
  "Offbeat Project",
  "Puzzled Cook",
  "Delightful Bother",
  "Illiterate Purpose",
  "Yellow Stick",
  "Accurate Poetry",
  "Actual Media",
  "Poor Step",
  "Vague Sport",
  "Glass Bet",
  "Creative Membership",
  "Drab Revenue",
  "United Front",
  "Rundown Novel",
  "Clean Application",
  "Optimal Comment",
  "Heavenly Stomach",
  "Friendly Food",
  "Average Pace",
  "Canine Reserve",
  "Luxurious Stress",
  "Sick Date",
  "Warped Player",
  "Educated Editor",
  "Self-Assured Strength",
  "Double Course",
  "Webbed Ear",
  "Upbeat Cream",
  "Unimportant Habit",
  "Slimy Context",
  "Frilly Fan",
  "Imaginative Percentage",
  "Dark Force",
  "Young Error",
  "Submissive Data",
  "Overdue Boyfriend",
  "Equatorial Blue",
  "Far Efficiency",
  "Upset Purple",
  "Corny Bag",
  "Squeaky Direction",
  "Required Inspection",
  "Close Emergency",
  "Infantile Panic",
  "Worthwhile Statement",
  "Single Population",
  "Unknown Entry",
  "Overcooked Penalty",
  "Free Dog",
  "Self-Reliant Place",
  "Untrue Difficulty",
  "Alarmed Tune",
  "Tough Camera",
  "Measly Bottle",
  "Suspicious Method",
  "Ready Conclusion",
  "Adored Picture",
  "Brief Reward",
  "Excited Bath",
  "Shady Customer",
  "Unrealistic Accident",
  "Joint Hair",
  "Unselfish Bite",
  "Numb Time",
  "Traumatic Press",
  "Jam-Packed Special",
  "Humongous Storm",
  "Parched Mall",
  "Delirious Cause",
  "Selfish Effect",
  "Magnificent Team",
  "Unique Shoot",
  "Crazy Comfort",
  "Adorable Local",
  "Serious Brain",
  "Mammoth Wine",
  "Substantial Eat",
  "Short-Term Farmer",
  "Snoopy Man",
  "Kind Elevator",
  "Needy Discussion",
  "Lustrous Ad",
  "Hollow Point",
  "Dreary Surgery",
  "Wobbly Software",
  "Sneaky Criticism",
  "Made-Up Replacement",
  "Feline Description",
  "Staid Story",
  "Loving Size",
  "Mortified Tax",
  "Outrageous Single",
  "Negative Highway",
  "Sniveling Matter",
  "Idolized Trip",
  "Haunting Gas",
  "Bare Joke",
  "Round Process",
  "Fair Trust",
  "Dependent Air",
  "Frigid Judgment",
  "Admirable Music",
  "Worldly Patience",
  "Granular Wind",
  "Thunderous Dimension",
  "Super System",
  "Nifty Anger",
  "Grotesque Grandmother",
  "Teeming Feeling",
  "Potable Extreme",
  "Sorrowful Switch",
  "Plump Belt",
  "Indolent Plant",
  "Babyish Horror",
  "Dutiful Balance",
  "Well-Groomed Sign",
  "Dual Plan",
  "Quaint Brick",
  "Content Edge",
  "Authentic Trick",
  "Imperturbable Expert",
  "Doting Age",
  "Functional Information",
  "Massive Gene",
  "Showy Crack",
  "Evil West",
  "Modest Lack",
  "Lame Guarantee",
  "Worse Reception",
  "Aged Walk",
  "Tight Grade",
  "Mealy Pie",
  "Beneficial Construction",
  "Posh Toe",
  "Steel Request",
  "Scented Towel",
  "Immaterial Preference",
  "Partial Race",
  "Scary Golf",
  "Considerate Answer",
  "Immediate Satisfaction",
  "Likely Part",
  "Horrible Tongue",
  "Fake Administration",
  "Oval Girl",
  "Humiliating Pair",
  "Warm Concert",
];

export function getAnonName(id: number) {
  return anonymousNames[(id - 1) % anonymousNames.length];
}
