import {
  AchievementCompletionType,
  AnonymousAchievementCompletionType,
} from "api/types/AchievementCompletionType.ts";
import { AchievementCommentType } from "api/types/AchievementCommentType.ts";
import { UserType } from "api/types/UserType.ts";
import { BeatmapConnectionType } from "api/types/BeatmapConnectionType.ts";
import { AchievementBatchType } from "api/types/AchievementBatchType.ts";
import { SolutionAlgorithmData } from "util/solutionAlgorithm.ts";
import { AchievementRatingType } from "api/types/AchievementRatingType.ts";

export type AchievementType = {
  id: number;
  name: string;
  description: string;
  audio: string;
  beatmaps: BeatmapConnectionType[];
  tags: string;
  created_at: string;
  last_edited_at: string;
  batch: AchievementBatchType | null;
  worth_points: boolean;
  solution_parts: number;
  solution?: string;
  creator?: { id: number; username: string } | null;
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
  upvotes: number;
  avg_difficulty_rating: number | null;
  avg_quality_rating: number | null;
  user_rating: AchievementRatingType | null;
  creator: UserType | null;
  solution_algorithm: SolutionAlgorithmData;
  algorithm_enabled: boolean;
  staff_solved: boolean;
} & AchievementType;

export const TAG_DESCRIPTIONS = {
  secret: "The solution to this achievement is not explicitly stated.",
  chat: "Completing this achievement involves sending an in-game DM to Sheppsu as part of the solution (messages checked by the server).",
  competition:
    "This achievement has a leaderboard and points are awarded based on your placement. Completions can be overruled with better ones by anyone on your team.",
  expert: "This achievement cannot be completed with the use of NF.",
  gimmick:
    "Completing this achievement requires a gimmick skill or non-conventional way of playing.",
  knowledge:
    "Finding the solution requires some non-basic level of knowledge about osu, osu history, or related (or requires research).",
  lazer:
    "This achievement must be completed on the lazer client or does not work on stable for all applicable modes of the achievement.",
  stable:
    "This achievement must be completed on the stable client or does not work on lazer for all applicable modes of the achievement.",
  math: "Finding the solution involves at least somewhat heavy use of math.",
  puzzle:
    "The achievement involves some kind of puzzle (e.g. sudoku, logic puzzle).",
  skill:
    "Completing the achievement involves a decent level of skill (this tag is somewhat subjective).",
  trivia:
    "This achievement incorporates some trivia-style general knowledge unrelated to osu!.",
  password:
    "Completing this achievement requires inputting the correct password. Find the input box on the achievement.",
  score:
    "Completing this achievement requires submitting at least one scores (may include failed scores).",
};
