import { BeatmapInfoType } from "./BeatmapInfoType";
import {
  AchievementCompletionType,
  AnonymousAchievementCompletionType,
} from "api/types/AchievementCompletionType.ts";
import { AchievementCommentType } from "api/types/AchievementCommentType.ts";

export type AchievementType = {
  id: number;
  name: string;
  description: string;
  audio: string;
  beatmap: BeatmapInfoType | null;
  tags: string;
};

export type AchievementExtendedType = {
  completion_count: number;
  completions: (
    | AchievementCompletionType
    | AnonymousAchievementCompletionType
  )[];
} & AchievementType;

export type StaffAchievementType = {
  solution: string;
  comments: AchievementCommentType[];
  vote_count: number;
  has_voted: boolean;
} & AchievementType;
