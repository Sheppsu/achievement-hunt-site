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
import { createContext, ReactNode, useContext, useState } from "react";
import { WebsocketState } from "types/WebsocketStateType";
import { timeAgo } from "util/helperFunctions";
import { EventContext, EventType } from "./EventContext";
import { SessionContext } from "./SessionContext";
import {
  StateDispatch,
  useDispatchStateContext,
  useStateContext,
} from "./StateContext";

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
  dispatchState: StateDispatch,
  queryClient: QueryClient,
) {
  const data = JSON.parse(evt.data);
  if (data.error !== undefined) {
    dispatchEventMsg({
      type: "error",
      msg: `Unexpected error from submission server: ${data.error}`,
    });
    return;
  }

  switch (data.code) {
    case 0: {
      dispatchState({ id: 2 });
      dispatchEventMsg({
        type: "info",
        msg: "You are now authenticated with the submission server",
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
  }
}

function connect(
  uri: string,
  dispatchEventMsg: React.Dispatch<{ type: EventType; msg: string }>,
  dispatchState: StateDispatch,
  queryClient: QueryClient,
  data: object,
): WebSocket {
  const ws = new WebSocket(uri);

  dispatchEventMsg({
    type: "info",
    msg: "Connecting to submission server...",
  });

  ws.addEventListener("open", (_) => {
    ws.send(JSON.stringify(data));
  });
  ws.addEventListener("close", (_) => {
    dispatchEventMsg({
      type: "error",
      msg: "Connection to submissions server failed or unexpectedly closed; reconnecting in 3 seconds...",
    });
    dispatchState({ id: 8 });
  });
  ws.addEventListener("message", (evt) => {
    handleMessage(evt, dispatchEventMsg, dispatchState, queryClient);
  });

  return ws;
}

function _sendSubmit(state: WebsocketState, dispatchState: StateDispatch) {
  if (state.ws === null || state.ws === undefined || !state.authenticated) {
    return;
  }

  state.ws.send(JSON.stringify({ code: 1, mode: state.mode }));

  dispatchState({ id: 3, disable: true });
  setTimeout(() => dispatchState({ id: 3, disable: false }), 5000);
}

function _sendChatMessage(
  state: WebsocketState,
  dispatchState: StateDispatch,
  msg: string,
) {
  throw new Error("Not implemented");
}

export const WebsocketContext = createContext<{
  sendSubmit: () => void;
  sendChatMessage: (msg: string) => void;
} | null>(null);

export function WebsocketContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const appState = useStateContext();
  const dispatchState = useDispatchStateContext();
  const queryClient = useContext(QueryClientContext)!;
  const dispatchEventMsg = useContext(EventContext);
  const session = useContext(SessionContext);

  const [connected, setConnected] = useState<boolean>(false);

  const { data: authData } = useQuery({
    queryKey: ["wsauth"],
    queryFn: () => fetch("/api/wsauth/").then((resp) => resp.json()),
  });

  if (authData !== undefined && appState.ws === null) {
    // mark connecting
    dispatchState({ id: 1, ws: undefined });

    setTimeout(
      () => {
        const ws = connect(
          session.wsUri,
          dispatchEventMsg,
          dispatchState,
          queryClient,
          authData,
        );
        dispatchState({ id: 1, ws });
      },
      Math.max(0, 3000 - (Date.now() - appState.lastDisconnect)),
    );
  }

  const sendSubmit = () => {
    _sendSubmit(appState, dispatchState);
  };

  const sendChatMessage = (msg: string) => {
    _sendChatMessage(appState, dispatchState, msg);
  };

  return (
    <WebsocketContext.Provider value={{ sendSubmit, sendChatMessage }}>
      {children}
    </WebsocketContext.Provider>
  );
}
