import { UserType } from "api/types/UserType.ts";

export type RegistrationType = {
  is_screened: boolean;
  is_free_agent: boolean;
};

export type RegistrationExtendedType = {
  user: UserType;
} & RegistrationType;
