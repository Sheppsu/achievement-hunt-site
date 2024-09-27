import {
  QueryClient,
  QueryClientContext,
  useQuery,
} from "@tanstack/react-query";
import { useContext } from "react";
import { useGetAchievements } from "api/query";
import { AchievementPlayerExtendedType } from "api/types/AchievementPlayerType";
import {
  AchievementTeamExtendedType,
  AchievementTeamType,
} from "api/types/AchievementTeamType";
import { AchievementExtendedType } from "api/types/AchievementType";
import { EventContext, EventType } from "contexts/EventContext";
import { SessionContext } from "contexts/SessionContext";
import { EVENT_END, NavItems } from "routes/achievements";

export type WebsocketState = {
  ws: WebSocket | null | undefined;
  authenticated: boolean;
  mode: number;
  submitEnabled: boolean;
  achievementsFilter: NavItems | null;
  achievementsSearchFilter: string; // probably put filter stuff in its own reducer
  hideCompletedAchievements: boolean;
  lastDisconnect: number;
};

export function defaultState(): WebsocketState {
  return {
    ws: null,
    authenticated: false,
    mode: 0,
    submitEnabled: false,
    achievementsFilter: null,
    achievementsSearchFilter: "",
    hideCompletedAchievements: false,
    lastDisconnect: 0
  };
}

type WSAchievementType = {
  id: number;
  name: string;
  category: string;
  time: string;
  value: number | null;
};
type RefreshReturnType = {
  achievements: WSAchievementType[];
  score: number;
  player: number;
};

function * insertValue(arr: number[], value: number) {
  for (const item of arr) {
    if (value > item)
      yield item;
    yield item;
  }
}

function onCompletedAchievement(
  data: RefreshReturnType,
  queryClient: QueryClient
) {
  queryClient.setQueryData(
    ["achievements", "teams"],
    (oldTeams: Array<AchievementTeamExtendedType | AchievementTeamType>) => {
      const teams = [];

      for (const team of oldTeams) {
        if ("invite" in team) {
          const players: AchievementPlayerExtendedType[] = [];

          const myTeam = team as AchievementTeamExtendedType;
          for (const player of myTeam.players) {
            if (player.id === data.player) {
              players.push({
                ...player,
                completions: player.completions.concat(
                  data.achievements.map((achievement) => ({
                    achievement_id: achievement.id,
                    time_completed: achievement.time,
                  }))
                ),
              });

              myTeam.points = data.score;

              continue;
            }
            players.push(player);
          }

          myTeam.players = players;
          teams.push(myTeam);
          continue;
        }
        teams.push(team);
      }

      return teams;
    }
  );

  queryClient.setQueryData(
    ["achievements"],
    (oldAchievements: AchievementExtendedType[]) => {
      const achievements = [];
      for (const achievement of oldAchievements) {
        for (const completion of data.achievements) {
          if (completion.id === achievement.id) {
            achievements.push({
              ...achievement,
              completions: achievement.completion_count + 1,
              placements: achievement.placements === undefined ? undefined : (
                Array.from(insertValue(achievement.placements, completion.value!))
              )
            });
          }
        }

        achievements.push(achievement);
      }

      return achievements;
    }
  );
}

function handleMessage(
  evt: MessageEvent<string>,
  dispatchEventMsg: React.Dispatch<{ type: EventType; msg: string }>,
  dispatchState: React.Dispatch<StateActionType>,
  queryClient: QueryClient
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
  data: object
): WebSocket {
  const ws = new WebSocket(uri);

  dispatchEventMsg({
    type: "info",
    msg: "Connecting to submission server..."
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
  id: 8
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
  action: StateActionType
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
        submitEnabled: true
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
        lastDisconnect: Date.now()
      };
  }
}

export type StateDispatch = React.Dispatch<StateActionType>;

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

  const eventEnded: boolean = Date.now() >= EVENT_END;

  if (authData !== undefined && state.ws === null) {
    // mark connecting
    dispatchState({id: 1, ws: undefined});

    setTimeout(() => {
      const ws = connect(
          session.wsUri,
          dispatchEventMsg,
          dispatchState,
          queryClient,
          authData
      );
      dispatchState({id: 1, ws});
    }, Math.max(0, 3000 - (Date.now() - state.lastDisconnect)))
  }

  if (team === null || achievements === undefined) {
    return <div>Loading team progress...</div>;
  }

  let achievementCount = 0;
  for (const player of team.players) {
    achievementCount += player.completions.length;
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
