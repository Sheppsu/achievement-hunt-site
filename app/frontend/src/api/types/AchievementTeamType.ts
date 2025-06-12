import { AchievementPlayerType } from "api/types/AchievementPlayerType.ts";

export type AchievementTeamType = {
  id: number;
  points: number;
  anonymous_name: string;
};

export type AchievementTeamExtendedType = {
  // includes player with list of completed achievements
  name: string;
  icon: string | null;
  players: AchievementPlayerType[];
  accepts_free_agents: boolean;
} & AchievementTeamType;
