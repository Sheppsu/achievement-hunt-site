import { AchievementPlayerType } from "api/types/AchievementPlayerType.ts";

export type AchievementCompletionType = {
  time_completed: string;
  time_placement: number;
  player: AchievementPlayerType;
  placement?: AchievementCompletionPlacementType | null;
};

export type AnonymousAchievementCompletionType = {
  placement: AchievementCompletionPlacementType;
};

export type AchievementCompletionPlacementType = {
  value: number;
  place: number;
};
