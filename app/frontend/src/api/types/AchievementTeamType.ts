import {AchievementPlayerType} from "api/types/AchievementPlayerType.ts";

export type AchievementTeamType = {
  id: number;
  name: string;
  icon: string | null;
  points: number;
};

export type AchievementTeamExtendedType = {
  // includes player with list of completed achievements
  players: AchievementPlayerType[];
  invite: string;
} & AchievementTeamType;
