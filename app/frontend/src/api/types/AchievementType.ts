import { BeatmapInfoType } from "./BeatmapInfoType";
import {
  AchievementCompletionType,
  AnonymousAchievementCompletionType,
} from "api/types/AchievementCompletionType.ts";
import { AchievementCommentType } from "api/types/AchievementCommentType.ts";
import { UserType } from "api/types/UserType.ts";

export type AchievementType = {
  id: number;
  name: string;
  description: string;
  audio: string;
  beatmap: BeatmapInfoType | null;
  tags: string;
  release_time: string | null;
  created_at: string;
  last_edited_at: string;
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
  creator: UserType;
} & AchievementType;
