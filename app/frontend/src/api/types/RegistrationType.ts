import { UserType } from "api/types/UserType.ts";

export type RegistrationType = {
  is_screened: boolean;
  is_free_agent: boolean;
  free_agent_type: number; // 1 = casual, 2 = competitive
};

export type RegistrationExtendedType = {
  user: UserType;
} & RegistrationType;
