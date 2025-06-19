import {
  AchievementCompletionType,
  AnonymousAchievementCompletionType,
} from "api/types/AchievementCompletionType.ts";
import { AchievementCommentType } from "api/types/AchievementCommentType.ts";
import { UserType } from "api/types/UserType.ts";
import { BeatmapConnectionType } from "api/types/BeatmapConnectionType.ts";
import { AchievementBatchType } from "api/types/AchievementBatchType.ts";

export type AchievementType = {
  id: number;
  name: string;
  description: string;
  audio: string;
  beatmaps: BeatmapConnectionType[];
  tags: string;
  release_time: string | null;
  created_at: string;
  last_edited_at: string;
  batch_id: number | null;
};

export type AchievementExtendedType = {
  completion_count: number;
  completions: (
    | AchievementCompletionType
    | AnonymousAchievementCompletionType
  )[];
} & AchievementType;

export type CompletedAchievementType = AchievementExtendedType & {
  completed: boolean;
  points: number | null;
};

export type StaffAchievementType = {
  solution: string;
  comments: AchievementCommentType[];
  vote_count: number;
  has_voted: boolean;
  creator: UserType | null;
  batch: AchievementBatchType | null;
} & AchievementType;
