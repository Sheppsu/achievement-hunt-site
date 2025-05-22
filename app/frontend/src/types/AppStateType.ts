import { NavItems } from "components/achievements/AchievementNavigationBar.tsx";

export function defaultState(): AppState {
  return {
    mode: 0,
    submitEnabled: false,
    achievementsFilter: null,
    achievementsSearchFilter: "",
    hideCompletedAchievements: false,
    showMyAchievements: false,
    volume: {
      value: parseFloat(localStorage.getItem("volume") ?? "0.5"),
      isMuted: localStorage.getItem("isMuted") === "t",
    },
  };
}

export type AppState = {
  mode: number | null;
  submitEnabled: boolean;
  achievementsFilter: NavItems | null;
  achievementsSearchFilter: string;
  hideCompletedAchievements: boolean;
  showMyAchievements: boolean;
  volume: {
    value: number;
    isMuted: boolean;
  };
};
