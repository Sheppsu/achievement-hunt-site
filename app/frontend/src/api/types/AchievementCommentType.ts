import { UserType } from "api/types/UserType.ts";

export type AchievementCommentType = {
  id: number;
  msg: string;
  user: UserType;
  posted_at: string;
};
