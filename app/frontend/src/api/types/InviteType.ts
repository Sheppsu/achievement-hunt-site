export type TeamInviteType = {
  id: number;
  user_id: number;
  username: string;
};

export type UserInviteType = {
  id: number;
  team_id: number;
  team_name: string;
};
