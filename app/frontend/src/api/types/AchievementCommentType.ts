import { UserType } from "api/types/UserType.ts";

export type AchievementCommentType = {
  id: number;
  msg: string;
  user: UserType;
  posted_at: string;
  edited_at: string | null;
  channel: number;
  achievement_id?: number;
};
