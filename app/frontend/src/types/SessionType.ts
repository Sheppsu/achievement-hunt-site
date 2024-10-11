import { UserType } from "../api/types/UserType";

export type Session = {
  isAuthenticated: boolean;
  user: UserType | null;
  authUrl: string;
  wsUri: string;
  debug: boolean;
  eventStart: number;
  eventEnd: number;
};
