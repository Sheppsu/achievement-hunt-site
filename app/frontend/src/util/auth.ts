import { Session } from "types/SessionType";
import { useContext } from "react";
import { SessionContext } from "contexts/SessionContext.ts";
import { ForbiddenError } from "../errors/ForbiddenError.ts";

export function getSessionData(): Session {
  return JSON.parse(document.getElementById("data")?.textContent as string);
}

export function useAuthEnsurer() {
  const session = useContext(SessionContext);

  const ensureStaff = () => {
    if (
      session.user === null ||
      (!session.user.is_admin && !session.user.is_achievement_creator)
    ) {
      throw new ForbiddenError();
    }
  };

  return {
    ensureStaff,
  };
}
