import { AchievementPlayerType } from "api/types/AchievementPlayerType.ts";

export type AchievementTeamType = {
  id: number;
  points: number;
};

export type AchievementTeamExtendedType = {
  // includes player with list of completed achievements
  name: string;
  icon: string | null;
  players: AchievementPlayerType[];
  invite: string;
  accepts_free_agents: boolean;
} & AchievementTeamType;
