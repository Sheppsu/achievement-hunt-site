import { QueryClient, QueryClientContext } from "@tanstack/react-query";
import { AchievementCompletionPlacementType } from "api/types/AchievementCompletionType";
import { AchievementPlayerType } from "api/types/AchievementPlayerType";
import { TeamDataType } from "api/types/AchievementTeamType";
import { AchievementExtendedType } from "api/types/AchievementType";
import {
  createContext,
  ReactNode,
  use,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { timeAgo } from "util/helperFunctions";
import { EventContext, EventType } from "./EventContext";
import { SessionContext } from "./SessionContext";
import { useDispatchStateContext, useStateContext } from "./StateContext";

export type ChatMessage = {
  name: string;
  message: string;
  sent_at: string;
};

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

export type WebsocketState = {
  connected: boolean;
};

export type WebsocketContextType = {
  state: WebsocketState;
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

  const wsRef = useRef<WebSocket | null>(null);
  const wsAttempts = useRef(0);
  const wsReconnectTimer = useRef<null | number>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const loggedIn = session.user !== null;
  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    connect();
  }, [loggedIn]);

  const connect = useCallback(() => {
    // reconnect already in progress or already connected
    if (wsReconnectTimer.current !== null || wsRef.current !== null) {
      return;
    }

    const ws = (wsRef.current = new WebSocket(session.wsUri));

    ws.addEventListener("open", () => {
      wsAttempts.current = 0;
      setWsConnected(true);
    });

    ws.addEventListener("error", () => {
      ws.close();
    });

    ws.addEventListener("close", (e) => {
      wsRef.current = null;
      setWsConnected(false);
      if (e.code !== 1000 && wsAttempts.current < 10) {
        wsReconnectTimer.current = setTimeout(() => {
          wsAttempts.current += 1;
          wsReconnectTimer.current = null;
          connect();
        }, 1000);
      }
    });

    ws.addEventListener("message", (evt) => {
      handleMessage(evt, dispatchEventMsg, queryClient);
    });
  }, [session.wsUri, dispatchEventMsg, queryClient]);

  const wsReady = useCallback(() => {
    return (
      wsRef.current !== null && wsRef.current.readyState === WebSocket.OPEN
    );
  }, []);

  const sendSubmit = useCallback(() => {
    if (!wsReady() || !appState.submitEnabled) {
      return;
    }

    wsRef.current!.send(
      JSON.stringify({ code: 1, mode: appState.submissionMode }),
    );

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
  }, [appState.submitEnabled, appState.submissionMode]);

  const sendChatMessage = useCallback(
    (msg: string) => {
      if (!wsReady() || !session.user) {
        return;
      }

      wsRef.current!.send(JSON.stringify({ code: 2, msg: msg }));
    },
    [session.user],
  );

  const resetConnection = useCallback(() => {
    if (wsReady()) {
      wsRef.current!.close();
    }
  }, []);

  return (
    <WebsocketContext.Provider
      value={{
        state: {
          connected: wsConnected,
        },
        sendSubmit,
        sendChatMessage,
        resetConnection,
      }}
    >
      {children}
    </WebsocketContext.Provider>
  );
}
