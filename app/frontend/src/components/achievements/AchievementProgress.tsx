import {
  QueryClient,
  QueryClientContext,
  useQuery,
} from "@tanstack/react-query";
import { useContext, useEffect, useReducer, useState } from "react";
import { useGetAchievements } from "api/query";
import { AchievementPlayerExtendedType } from "api/types/AchievementPlayerType";
import {
  AchievementTeamExtendedType,
  AchievementTeamType,
} from "api/types/AchievementTeamType";
import { AchievementExtendedType } from "api/types/AchievementType";
import { EventContext, EventStateType } from "contexts/EventContext";
import { SessionContext } from "contexts/SessionContext";
import { EVENT_END, NavItems } from "routes/achievements";
import { Search } from "react-router-dom";

export type WebsocketState = {
  ws: WebSocket | null;
  authenticated: boolean;
  mode: number;
  submitEnabled: boolean;
  achievementsFilter: NavItems;
  achievementsSearchFilter: string; // probably put filter stuff in its own reducer
  hideCompletedAchievements: boolean;
  activeTag: string;
};

export function defaultState(): WebsocketState {
  return {
    ws: null,
    authenticated: false,
    mode: 0,
    submitEnabled: false,
    achievementsFilter: {
      mode: [
        {
          label: "default",
          active: false,
        },
      ],
      categories: [{ label: "default", active: false }],
      tags: [{ label: "default", active: false }],
    },
    achievementsSearchFilter: "",
    hideCompletedAchievements: false,
    activeTag: "",
  };
}

type WSAchievementType = {
  id: number;
  name: string;
  category: string;
  time: string;
};
type RefreshReturnType = {
  achievements: WSAchievementType[];
  score: number;
  player: number;
};

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

  const completedIds = data.achievements.map((a) => a.id);
  queryClient.setQueryData(
    ["achievements"],
    (oldAchievements: AchievementExtendedType[]) => {
      const achievements = [];
      for (const achievement of oldAchievements) {
        if (completedIds.includes(achievement.id)) {
          achievements.push({
            ...achievement,
            completions: achievement.completions + 1,
          });
          continue;
        }

        achievements.push(achievement);
      }

      return achievements;
    }
  );
}

function handleMessage(
  evt: MessageEvent<string>,
  dispatchEventMsg: React.Dispatch<{ type: EventStateType; msg: string }>,
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
      dispatchState({ id: 2, auth: true });
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
  dispatchEventMsg: React.Dispatch<{ type: EventStateType; msg: string }>,
  dispatchState: StateDispatch,
  queryClient: QueryClient,
  data: object
): WebSocket {
  const ws = new WebSocket(uri);

  ws.addEventListener("open", (evt) => {
    ws.send(JSON.stringify(data));
  });
  ws.addEventListener("close", (evt) => {
    dispatchEventMsg({
      type: "error",
      msg: "Connection to submissions server unexpectedly closed; reconnecting...",
    });
    dispatchState({ id: 2, auth: false });
  });
  ws.addEventListener("error", (evt) => {
    dispatchEventMsg({
      type: "error",
      msg: "Submission server returned an unexpected error",
    });
  });
  ws.addEventListener("message", (evt) => {
    handleMessage(evt, dispatchEventMsg, dispatchState, queryClient);
  });

  return ws;
}

function sendSubmit(state: WebsocketState, dispatchState: StateDispatch) {
  if (state.ws === null || !state.authenticated) {
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
  ws: WebSocket;
}

interface AuthType extends BaseStateActionType {
  id: 2;
  auth: boolean;
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

interface TagType extends BaseStateActionType {
  id: 8;
  activeTag: string;
}

type StateActionType =
  | ConnectingType
  | AuthType
  | SubmitType
  | ModeType
  | FilterType
  | SearchFilterType
  | CheckboxType
  | TagType;

export function wsReducer(
  state: WebsocketState,
  action: StateActionType
): WebsocketState {
  switch (action.id) {
    case 1:
      return {
        ...state,
        ws: action.ws,
      };
    case 2:
      return {
        ...state,
        ws: action.auth ? state.ws : null,
        authenticated: action.auth,
        submitEnabled: action.auth,
      };
    case 3:
      return {
        ...state,
        submitEnabled: !action.disable,
      };
    case 4:
      return {
        ...state,
        mode: action.mode,
      };
    case 5:
      return {
        ...state,
        achievementsFilter: action.achievementsFilter,
      };
    case 6:
      return {
        ...state,
        achievementsSearchFilter: action.achievementsSearchFilter,
      };
    case 7:
      return {
        ...state,
        hideCompletedAchievements: action.hideCompletedAchievements,
      };
    case 8:
      return {
        ...state,
        activeTag: action.activeTag,
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
    const ws = connect(
      session.wsUri,
      dispatchEventMsg,
      dispatchState,
      queryClient,
      authData
    );
    dispatchState({ id: 1, ws });
  }

  if (team === null || achievements === undefined) {
    return <div>Loading team progress...</div>;
  }

  let achievementCount = 0;
  for (const player of team.players) {
    achievementCount += player.completions.length;
  }

  console.log(state.ws, state.authenticated, eventEnded, state.submitEnabled);
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
