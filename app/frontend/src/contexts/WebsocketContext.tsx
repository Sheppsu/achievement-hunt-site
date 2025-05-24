import {
  QueryClient,
  QueryClientContext,
  useQuery,
} from "@tanstack/react-query";
import { AchievementCompletionPlacementType } from "api/types/AchievementCompletionType";
import { AchievementPlayerType } from "api/types/AchievementPlayerType";
import {
  AchievementTeamExtendedType,
  AchievementTeamType,
} from "api/types/AchievementTeamType";
import { AchievementExtendedType } from "api/types/AchievementType";
import { createContext, ReactNode, useContext, useReducer } from "react";
import { AppState } from "types/AppStateType";
import { Session } from "types/SessionType";
import { timeAgo } from "util/helperFunctions";
import { EventContext, EventType } from "./EventContext";
import { SessionContext } from "./SessionContext";
import { useStateContext } from "./StateContext";

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
  ws: WebSocket | undefined;
}

interface DisconnectionType extends BaseStateActionType {
  id: 2;
}

interface AuthType extends BaseStateActionType {
  id: 3;
}

interface SubmitType extends BaseStateActionType {
  id: 4;
  disable: boolean;
}

type WsStateActionType =
  | ConnectingType
  | AuthType
  | DisconnectionType
  | SubmitType;

export type WebsocketState = {
  ws: WebSocket | null | undefined;
  authenticated: boolean;
  lastDisconnect: number;
  submitEnabled: boolean;
};

export type WebsocketStateDispatch = React.Dispatch<WsStateActionType>;

function wsStateReducer(
  state: WebsocketState,
  action: WsStateActionType,
): WebsocketState {
  switch (action.id) {
    case 1: // connection
      return {
        ...state,
        ws: action.ws,
      };
    case 2: // disconnection
      return {
        ...state,
        ws: null,
        authenticated: false,
        submitEnabled: false,
        lastDisconnect: Date.now(),
      };
    case 3: // authenticated
      return {
        ...state,
        authenticated: true,
        submitEnabled: true,
      };
    case 4: // submission
      return {
        ...state,
        submitEnabled: !action.disable,
      };
  }
}

type WSAchievementType = {
  id: number;
  name: string;
  category: string;
  time: string;
  placement: AchievementCompletionPlacementType | null;
};

type RefreshReturnType = {
  achievements: WSAchievementType[];
  score: number;
  player: AchievementPlayerType;
  last_score: string;
  score_gain: number;
};

function onCompletedAchievement(
  data: RefreshReturnType,
  queryClient: QueryClient,
  dispatchEventMsg: React.Dispatch<{ type: EventType; msg: string }>,
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
  queryClient.setQueryData(
    ["teams"],
    (teams: (AchievementTeamType | AchievementTeamExtendedType)[]) => {
      const newTeams = [];

      for (const team of teams) {
        if (!("players" in team)) {
          newTeams.push(team);
          continue;
        }

        let added = false;

        for (const player of team.players) {
          if (player.id === data.player.id) {
            dispatchEventMsg({
              type: "info",
              msg: `+${data.score_gain}pts`,
            });
            newTeams.push({ ...team, points: data.score });
            added = true;
            break;
          }
        }

        if (!added) newTeams.push(team);
      }
    },
  );
}

function handleMessage(
  evt: MessageEvent<string>,
  dispatchEventMsg: React.Dispatch<{ type: EventType; msg: string }>,
  dispatchWsState: WebsocketStateDispatch,
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
    case 0: {
      dispatchWsState({ id: 3 });
      dispatchEventMsg({
        type: "info",
        msg: "You are now authenticated with the websocket server",
      });
      break;
    }
    case 1: {
      const achievements = data.achievements as WSAchievementType[];
      let msg =
        achievements.length === 0
          ? "No achievements completed."
          : `You completed ${achievements.length} achievement(s)! ${achievements
              .map((achievement) => achievement.name)
              .join(", ")}.`;
      msg +=
        " Last score: " +
        (data.last_score === null ? "no scores" : timeAgo(data.last_score));
      dispatchEventMsg({ type: "info", msg: msg });

      if (achievements.length > 0) {
        onCompletedAchievement(data, queryClient, dispatchEventMsg);
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

function connect(
  uri: string,
  dispatchEventMsg: React.Dispatch<{ type: EventType; msg: string }>,
  dispatchWsState: WebsocketStateDispatch,
  queryClient: QueryClient,
  data: object,
  session: Session,
): WebSocket {
  const ws = new WebSocket(uri);

  ws.addEventListener("open", (_) => {
    ws.send(JSON.stringify(data));
  });
  ws.addEventListener("close", (_) => {
    dispatchEventMsg({
      type: "error",
      msg: "Connection to websocket server failed or unexpectedly closed; reconnecting in 5 seconds...",
    });
    dispatchWsState({ id: 2 });
  });
  ws.addEventListener("message", (evt) => {
    handleMessage(evt, dispatchEventMsg, dispatchWsState, queryClient);
  });

  return ws;
}

function _sendSubmit(
  wsState: WebsocketState,
  dispatchWsState: WebsocketStateDispatch,
  appState: AppState,
) {
  if (
    wsState.ws === null ||
    wsState.ws === undefined ||
    !wsState.authenticated
  ) {
    return;
  }

  wsState.ws.send(JSON.stringify({ code: 1, mode: appState.mode }));

  dispatchWsState({ id: 4, disable: true });
  setTimeout(() => dispatchWsState({ id: 4, disable: false }), 5000);
}

function _sendChatMessage(
  wsState: WebsocketState,
  session: Session,
  msg: string,
) {
  if (
    wsState.ws === null ||
    wsState.ws === undefined ||
    !wsState.authenticated ||
    !session.user
  ) {
    return;
  }

  wsState.ws.send(JSON.stringify({ code: 2, msg: msg }));
}

export const WebsocketContext = createContext<{
  wsState: WebsocketState;
  dispatchWsState: WebsocketStateDispatch;
  sendSubmit: () => void;
  sendChatMessage: (msg: string) => void;
} | null>(null);

export function WebsocketContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useContext(QueryClientContext)!;
  const dispatchEventMsg = useContext(EventContext);
  const session = useContext(SessionContext);
  const appState = useStateContext();

  const [wsState, dispatchWsState] = useReducer(wsStateReducer, {
    ws: null,
    authenticated: false,
    lastDisconnect: 0,
    submitEnabled: false,
  });

  const { data: authData } = useQuery({
    queryKey: ["wsauth"],
    queryFn: () => fetch("/api/wsauth/").then((resp) => resp.json()),
  });

  if (authData !== undefined && !("error" in authData) && wsState.ws === null) {
    // mark connecting
    dispatchWsState({ id: 1, ws: undefined });

    setTimeout(
      () => {
        const ws = connect(
          session.wsUri,
          dispatchEventMsg,
          dispatchWsState,
          queryClient,
          authData,
          session,
        );
        dispatchWsState({ id: 1, ws });
      },
      Math.max(0, 5000 - (Date.now() - wsState.lastDisconnect)),
    );
  }

  const sendSubmit = () => {
    _sendSubmit(wsState, dispatchWsState, appState);
  };

  const sendChatMessage = (msg: string) => {
    _sendChatMessage(wsState, session, msg);
  };

  return (
    <WebsocketContext.Provider
      value={{ wsState, dispatchWsState, sendSubmit, sendChatMessage }}
    >
      {children}
    </WebsocketContext.Provider>
  );
}
