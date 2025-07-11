import { RegistrationExtendedType } from "api/types/RegistrationType.ts";

export type AllRegistrationsType = {
  registration_count: number;
  registrations?: RegistrationExtendedType[];
};
