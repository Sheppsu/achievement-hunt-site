import { NavItems } from "components/achievements/AchievementNavigationBar.tsx";

export function defaultState(): WebsocketState {
  return {
    ws: null,
    authenticated: false,
    mode: 0,
    submitEnabled: false,
    achievementsFilter: null,
    achievementsSearchFilter: "",
    hideCompletedAchievements: false,
    showMyAchievements: false,
    lastDisconnect: 0,
    volume: {
      value: parseFloat(localStorage.getItem("volume") ?? "0.5"),
      isMuted: localStorage.getItem("isMuted") === "t",
    },
  };
}

export type WebsocketState = {
  ws: WebSocket | null | undefined;
  authenticated: boolean;
  mode: number | null;
  submitEnabled: boolean;
  achievementsFilter: NavItems | null;
  achievementsSearchFilter: string; // probably put filter stuff in its own reducer
  hideCompletedAchievements: boolean;
  showMyAchievements: boolean;
  lastDisconnect: number;
  volume: {
    value: number;
    isMuted: boolean;
  };
};
