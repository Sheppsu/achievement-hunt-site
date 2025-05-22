import {
  NavItems,
  SortedNavRowItems,
} from "components/achievements/AchievementNavigationBar.tsx";
import { createContext, useContext } from "react";
import { AppState } from "types/AppStateType.ts";

interface BaseStateActionType {
  id: number;
}

interface ModeType extends BaseStateActionType {
  id: 4;
  mode: number | null;
}

interface FilterType extends BaseStateActionType {
  id: 5;
  achievementsFilter: NavItems;
}

interface SearchFilterType extends BaseStateActionType {
  id: 6;
  achievementsSearchFilter: string;
}

interface CheckboxType extends BaseStateActionType {
  id: 7;
  hideCompletedAchievements: boolean;
}

interface AdjustAudioType extends BaseStateActionType {
  id: 9;
  value: number;
  isMuted: boolean;
}

interface ActivateNavItem extends BaseStateActionType {
  id: 10;
  label: keyof NavItems["rows"];
  item: string;
  multiSelect: boolean;
}

interface SwitchNavItemSort extends BaseStateActionType {
  id: 11;
  label: keyof NavItems["rows"];
}

interface HideMyAchievements extends BaseStateActionType {
  id: 12;
  hideMyAchievements: boolean;
}

type StateActionType =
  | ModeType
  | FilterType
  | SearchFilterType
  | CheckboxType
  | AdjustAudioType
  | ActivateNavItem
  | SwitchNavItemSort
  | HideMyAchievements;

export function stateReducer(
  state: AppState,
  action: StateActionType,
): AppState {
  switch (action.id) {
    case 4: // mode
      return {
        ...state,
        mode: action.mode,
      };
    case 5: // filter change
      return {
        ...state,
        achievementsFilter: action.achievementsFilter,
      };
    case 6: // search change
      return {
        ...state,
        achievementsSearchFilter: action.achievementsSearchFilter,
      };
    case 7: // hide achievements
      return {
        ...state,
        hideCompletedAchievements: action.hideCompletedAchievements,
      };
    case 9: {
      // audio adjustment
      localStorage.setItem("volume", action.value.toString());
      localStorage.setItem("isMuted", action.isMuted ? "t" : "f");
      return {
        ...state,
        volume: {
          value: action.value,
          isMuted: action.isMuted,
        },
      };
    }
    case 10: {
      const newFilter = { ...state.achievementsFilter! };

      if (action.multiSelect) {
        for (const item of newFilter.rows[action.label].items) {
          if (item.label === action.item) item.active = !item.active;
        }
      } else {
        for (const item of newFilter.rows[action.label].items)
          item.active = item.label === action.item;
      }

      return {
        ...state,
        achievementsFilter: newFilter,
      };
    }
    case 11: {
      const newFilter = { ...state.achievementsFilter! };

      const row = newFilter.rows[action.label] as SortedNavRowItems;
      row.sort = row.sort === "desc" ? "asc" : "desc";

      return {
        ...state,
        achievementsFilter: newFilter,
      };
    }
    case 12:
      return {
        ...state,
        showMyAchievements: action.hideMyAchievements,
      };
  }
}

export type StateDispatch = React.Dispatch<StateActionType>;

export const StateContext = createContext<AppState | null>(null);
export const StateDispatchContext = createContext<StateDispatch | null>(null);

export function useStateContext(): AppState {
  return useContext(StateContext)!;
}

export function useDispatchStateContext(): StateDispatch {
  return useContext(StateDispatchContext)!;
}
