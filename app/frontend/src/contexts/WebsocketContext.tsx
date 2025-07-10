import { QueryClient, QueryClientContext } from "@tanstack/react-query";
import { AchievementCompletionPlacementType } from "api/types/AchievementCompletionType";
import { AchievementPlayerType } from "api/types/AchievementPlayerType";
import {
  AchievementTeamExtendedType,
  AchievementTeamType,
  TeamDataType,
} from "api/types/AchievementTeamType";
import { AchievementExtendedType } from "api/types/AchievementType";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { AppState } from "types/AppStateType";
import { Session } from "types/SessionType";
import { timeAgo } from "util/helperFunctions";
import { EventContext, EventType } from "./EventContext";
import { SessionContext } from "./SessionContext";
import {
  StateDispatch,
  useDispatchStateContext,
  useStateContext,
} from "./StateContext";

export type ChatMessage = {
  name: string;
  message: string;
  sent_at: string;
};

interface BaseStateActionType {
  id: number;
}

interface ConnectingType extends BaseStateActionType {
  id: 1;
  ws: WebSocket;
}

interface DisconnectionType extends BaseStateActionType {
  id: 2;
}

interface ConnectionStatusType extends BaseStateActionType {
  id: 3;
  connected: boolean;
}

type WsStateActionType =
  | ConnectingType
  | DisconnectionType
  | ConnectionStatusType;

export type WebsocketState = {
  ws: WebSocket | null;
  lastDisconnect: number;
  connected: boolean;
};

export type WebsocketStateDispatch = React.Dispatch<WsStateActionType>;

function wsStateReducer(
  state: WebsocketState | null,
  action: WsStateActionType,
): WebsocketState | null {
  switch (action.id) {
    case 1: // connecting
      return {
        ws: action.ws,
        lastDisconnect: state === null ? 0 : state.lastDisconnect,
        connected: state === null ? false : state.connected,
      };
    case 2: // disconnection
      return {
        ws: null,
        lastDisconnect: Date.now(),
        connected: false,
      };
    case 3: {
      // connection status change
      if (state === null) {
        return null;
      }

      return {
        ...state,
        connected: action.connected,
      };
    }
  }
}

type WSAchievementType = {
  id: number;
  name: string;
  category: string;
  time: string;
  placement: AchievementCompletionPlacementType | null;
  time_placement: number;
};

type RefreshReturnType = {
  achievements: WSAchievementType[];
  score: number;
  player: AchievementPlayerType;
  last_score?: string;
  score_gain: number;
};

function onCompletedAchievement(
  data: RefreshReturnType,
  queryClient: QueryClient,
) {
  // add completions to achievements
  queryClient.setQueryData(
    ["achievements"],
    (achievements: AchievementExtendedType[]) => {
      for (const completed of data.achievements) {
        for (const achievement of achievements) {
          if (achievement.id === completed.id) {
            // remove existing entry (for competition achievements)
            achievement.completions = achievement.completions.filter(
              (c) => !("player" in c),
            );

            achievement.completion_count += 1;
            achievement.completions.push({
              time_completed: completed.time,
              time_placement: completed.time_placement,
              player: data.player,
              placement:
                completed.placement === null ||
                completed.placement === undefined ||
                completed.placement.value === null
                  ? undefined
                  : completed.placement,
            });

            break;
          }
        }
      }

      return achievements;
    },
  );

  // update score
  queryClient.setQueryData(["teams"], (teamData: TeamDataType) => {
    const newTeams = [];

    for (const team of teamData.teams) {
      if (!("players" in team)) {
        newTeams.push(team);
        continue;
      }

      let added = false;

      for (const player of team.players) {
        if (player.id === data.player.id) {
          newTeams.push({ ...team, points: data.score });
          added = true;
          break;
        }
      }

      if (!added) newTeams.push(team);
    }
  });
}

function handleMessage(
  evt: MessageEvent<string>,
  dispatchEventMsg: React.Dispatch<{ type: EventType; msg: string }>,
  queryClient: QueryClient,
) {
  const data = JSON.parse(evt.data);
  if (data.error !== undefined) {
    dispatchEventMsg({
      type: "error",
      msg: `Unexpected error from websocket server: ${data.error}`,
    });
    return;
  }

  switch (data.code) {
    case 1: {
      const achievements = data.achievements as WSAchievementType[];
      let msg =
        achievements.length === 0
          ? "No achievements completed."
          : `You completed ${achievements.length} achievement(s)! ${achievements
              .map((achievement) => achievement.name)
              .join(", ")}.`;

      if (data.last_score !== undefined) {
        msg +=
          " Last score: " +
          (data.last_score === null ? "no scores" : timeAgo(data.last_score));
      }

      dispatchEventMsg({ type: "info", msg: msg });

      if (achievements.length > 0) {
        onCompletedAchievement(data, queryClient);
      }

      break;
    }
    case 2: {
      const current_path = window.location.pathname.slice(1);
      if (current_path !== "teams") {
        dispatchEventMsg({
          type: "info",
          msg: `New team chat message from ${data.msg.name}! Go to your dashboard to read it.`,
        });
      }
      queryClient.setQueryData(
        ["teams", "messages"],
        (messages: ChatMessage[]) => {
          return [...messages, data.msg];
        },
      );
    }
  }
}

function _sendSubmit(
  wsState: WebsocketState,
  appState: AppState,
  dispatchAppState: StateDispatch,
) {
  if (wsState.ws === null || !appState.submitEnabled) {
    return;
  }

  wsState.ws.send(JSON.stringify({ code: 1, mode: appState.submissionMode }));

  // disable submission for 5 seconds
  dispatchAppState({
    id: 3,
    enable: false,
  });
  setTimeout(() => {
    dispatchAppState({
      id: 3,
      enable: true,
    });
  }, 60000);
}

function _sendChatMessage(
  wsState: WebsocketState,
  session: Session,
  msg: string,
) {
  if (wsState.ws === null || !session.user) {
    return;
  }

  wsState.ws.send(JSON.stringify({ code: 2, msg: msg }));
}

function _resetConnection(state: WebsocketState) {
  if (state !== null && state.ws !== null) {
    state.ws.close();
  }
}

export type WebsocketContextType = {
  wsState: WebsocketState | null;
  dispatchWsState: WebsocketStateDispatch;
  sendSubmit: () => void;
  sendChatMessage: (msg: string) => void;
  resetConnection: () => void;
} | null;

export const WebsocketContext = createContext<WebsocketContextType>(null);

export function WebsocketContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useContext(QueryClientContext)!;
  const dispatchEventMsg = useContext(EventContext);
  const session = useContext(SessionContext);
  const appState = useStateContext();
  const dispatchAppState = useDispatchStateContext();

  const [wsState, dispatchWsState] = useReducer(wsStateReducer, null);

  const loggedIn = session.user !== null;
  const currentWs = wsState === null ? null : wsState.ws;
  useEffect(() => {
    if (currentWs !== null || !loggedIn) {
      return;
    }

    const ws = new WebSocket(session.wsUri);

    ws.addEventListener("open", () => {
      dispatchWsState({ id: 3, connected: true });
    });
    ws.addEventListener("close", (_) => {
      dispatchWsState({ id: 2 });
    });
    ws.addEventListener("message", (evt) => {
      handleMessage(evt, dispatchEventMsg, queryClient);
    });

    dispatchWsState({
      id: 1,
      ws,
    });
  }, [currentWs, loggedIn]);

  const sendSubmit = () => {
    if (wsState === null) {
      return;
    }

    _sendSubmit(wsState, appState, dispatchAppState);
  };

  const sendChatMessage = (msg: string) => {
    if (wsState === null) {
      return;
    }

    _sendChatMessage(wsState, session, msg);
  };

  const resetConnection = () => {
    if (wsState === null) {
      return;
    }

    _resetConnection(wsState);
  };

  return (
    <WebsocketContext.Provider
      value={{
        wsState,
        dispatchWsState,
        sendSubmit,
        sendChatMessage,
        resetConnection,
      }}
    >
      {children}
    </WebsocketContext.Provider>
  );
}
