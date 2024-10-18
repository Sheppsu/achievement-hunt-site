import { createContext, useContext } from "react";
import { WebsocketState } from "types/WebsocketStateType.ts";
import { NavItems } from "routes/achievements.tsx";

interface BaseStateActionType {
  id: number;
}

interface ConnectingType extends BaseStateActionType {
  id: 1;
  ws: WebSocket | undefined;
}

interface AuthType extends BaseStateActionType {
  id: 2;
}

interface SubmitType extends BaseStateActionType {
  id: 3;
  disable: boolean;
}

interface ModeType extends BaseStateActionType {
  id: 4;
  mode: number;
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

interface DisconnectionType extends BaseStateActionType {
  id: 8;
}

type StateActionType =
  | ConnectingType
  | AuthType
  | SubmitType
  | ModeType
  | FilterType
  | SearchFilterType
  | CheckboxType
  | DisconnectionType;

export function wsReducer(
  state: WebsocketState,
  action: StateActionType,
): WebsocketState {
  switch (action.id) {
    case 1: // connection
      return {
        ...state,
        ws: action.ws,
      };
    case 2: // auth or disconnection
      return {
        ...state,
        authenticated: true,
        submitEnabled: true,
      };
    case 3: // submission
      return {
        ...state,
        submitEnabled: !action.disable,
      };
    case 4: // mode change
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
    case 8: // disconnection
      return {
        ...state,
        ws: null,
        authenticated: false,
        submitEnabled: false,
        lastDisconnect: Date.now(),
      };
  }
}

export type StateDispatch = React.Dispatch<StateActionType>;

export const StateContext = createContext<WebsocketState | null>(null);
export const StateDispatchContext = createContext<StateDispatch | null>(null);

export function useStateContext(): WebsocketState {
  return useContext(StateContext)!;
}

export function useDispatchStateContext(): StateDispatch {
  return useContext(StateDispatchContext)!;
}
