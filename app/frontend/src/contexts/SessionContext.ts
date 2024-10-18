import { createContext } from "react";
import { getSessionData } from "util/auth";
import { WebsocketState } from "components/achievements/AchievementProgress.tsx";

function defaultState(): WebsocketState {
  return {
    ws: null,
    authenticated: false,
    mode: 0,
    submitEnabled: false,
    achievementsFilter: null,
    achievementsSearchFilter: "",
    hideCompletedAchievements: false,
    lastDisconnect: 0,
  };
}

export const SessionContext = createContext(getSessionData());
