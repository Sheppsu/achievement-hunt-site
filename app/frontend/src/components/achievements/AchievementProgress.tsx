import {
  QueryClient,
  QueryClientContext,
  useQuery,
} from "@tanstack/react-query";
import { useContext } from "react";
import { useGetAchievements } from "api/query";
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType";
import { AchievementExtendedType } from "api/types/AchievementType";
import { EventContext, EventType } from "contexts/EventContext";
import { SessionContext } from "contexts/SessionContext";
import { AchievementPlayerType } from "api/types/AchievementPlayerType.ts";
import { AchievementCompletionPlacementType } from "api/types/AchievementCompletionType.ts";
import { WebsocketState } from "types/WebsocketStateType.ts";
import { StateDispatch } from "contexts/StateContext.ts";

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
              player: data.player,
              placement: completed.placement ?? undefined,
            });

            break;
          }
        }
      }

      return achievements;
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
      const msg =
        achievements.length === 0
          ? "No achievements completed"
          : `You completed ${achievements.length} achievement(s)! ${achievements
              .map((achievement) => achievement.name)
              .join(", ")}`;
      dispatchEventMsg({ type: "info", msg: msg });

      if (achievements.length > 0) {
        onCompletedAchievement(data, queryClient);
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

function sendSubmit(state: WebsocketState, dispatchState: StateDispatch) {
  if (state.ws === null || state.ws === undefined || !state.authenticated) {
    return;
  }

  state.ws.send(JSON.stringify({ code: 1, mode: state.mode }));

  dispatchState({ id: 3, disable: true });
  setTimeout(() => dispatchState({ id: 3, disable: false }), 5000);
}

export default function AchievementProgress({
  team,
  state,
  dispatchState,
}: {
  team: AchievementTeamExtendedType | null;
  state: WebsocketState;
  dispatchState: StateDispatch;
}) {
  const session = useContext(SessionContext);
  const queryClient = useContext(QueryClientContext) as QueryClient;
  const dispatchEventMsg = useContext(EventContext);

  const { data: authData } = useQuery({
    queryKey: ["wsauth"],
    queryFn: () => fetch("/api/wsauth/").then((resp) => resp.json()),
  });
  const { data: achievements } = useGetAchievements();

  const eventEnded: boolean = Date.now() >= session.eventEnd;

  if (authData !== undefined && state.ws === null) {
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
      Math.max(0, 3000 - (Date.now() - state.lastDisconnect)),
    );
  }

  if (team === null || achievements === undefined) {
    return <div>Loading team progress...</div>;
  }

  // count number of completed achievements
  let achievementCount = 0;
  for (const achievement of achievements) {
    for (const completion of achievement.completions) {
      for (const player of team.players) {
        if ("player" in completion && completion.player.id === player.id) {
          achievementCount += 1;
          break;
        }
      }
    }
  }

  const submitDisabled =
    state.ws === null ||
    !state.authenticated ||
    eventEnded ||
    !state.submitEnabled;
  const submitCls = "submit-button" + (submitDisabled ? " disabled" : "");

  function onSubmit() {
    if (submitDisabled) return;
    sendSubmit(state, dispatchState);
  }

  return (
    <div className="total-achievements-container">
      <div className="total-achievements-inner-container">
        <h1>Achievement progress</h1>
        <h1>{`${achievementCount}/${
          (achievements as AchievementExtendedType[]).length
        }`}</h1>
        <div className="progress-bar">
          <div
            className="progress-bar-inner"
            style={{
              width: `${(achievementCount / achievements.length) * 100}%`,
            }}
          ></div>
        </div>
      </div>
      <div className={submitCls} onClick={onSubmit}>
        Submit
      </div>
    </div>
  );
}
