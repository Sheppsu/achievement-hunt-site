import {
  MutationKey,
  QueryClientContext,
  UseMutationOptions,
  UseMutationResult,
  UseQueryResult,
  queryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { AchievementExtendedType } from "./types/AchievementType";
import {
  AchievementTeamType,
  AchievementTeamExtendedType,
} from "./types/AchievementTeamType";
import { useContext } from "react";
import { EventContext, EventStateType } from "contexts/EventContext";
import { UndefinedInitialDataOptions } from "node_modules/@tanstack/react-query/build/legacy";
import { AchievementPlayerType } from "./types/AchievementPlayerType";

function getUrl(endpoint: string): string {
  endpoint = endpoint.startsWith("/") ? endpoint : "/" + endpoint;
  endpoint = endpoint.endsWith("/") ? endpoint : endpoint + "/";
  return "/api" + endpoint;
}

async function doFetch<T>(
  dispatchEventMsg: React.Dispatch<{
    type: EventStateType;
    msg?: string | undefined;
    id?: number | undefined;
  }>,
  endpoint: string,
  init?: RequestInit
): Promise<T> {
  const resp = await fetch(getUrl(endpoint), init);

  if (resp.status !== 200) {
    let errorMsg = null;
    try {
      const error = await resp.json();
      errorMsg = error.error;
      // eslint-disable-next-line no-empty
    } catch {}

    dispatchEventMsg({
      type: "error",
      msg: `Request error${errorMsg === null ? "" : ": " + errorMsg}`,
    });
    console.error(`Error fetching ${endpoint}: `, errorMsg);
    throw Error(errorMsg);
  }

  return (await resp.json()).data;
}

export function useMakeQuery<T>(
  query: UndefinedInitialDataOptions<T>,
  init?: RequestInit
): UseQueryResult<T> {
  const dispatchEventMsg = useContext(EventContext);
  const endpoint = query.queryKey.join("/");

  query.queryFn = () => doFetch(dispatchEventMsg, endpoint, init);

  return useQuery(queryOptions(query));
}

type SpecificUseMutationResult<T> = UseMutationResult<T, Error, object>;

export function useMakeMutation<T>(
  mutation: UseMutationOptions<T, Error, object, unknown>,
  init?: RequestInit
): SpecificUseMutationResult<T> {
  const dispatchEventMsg = useContext(EventContext);
  const endpoint = (mutation.mutationKey as MutationKey).join("/");

  mutation.mutationFn = (data: object) =>
    doFetch(dispatchEventMsg, endpoint, {
      body: JSON.stringify(data),
      ...init,
    });

  return useMutation<T, Error, object, unknown>(mutation);
}

export function useGetAchievements(
  enabled: boolean = true
): UseQueryResult<AchievementExtendedType[]> {
  return useMakeQuery({
    queryKey: ["achievements"],
    enabled,
    refetchInterval: 60000
  });
}

export function useGetTeams(
  enabled: boolean = true
): UseQueryResult<Array<AchievementTeamType | AchievementTeamExtendedType>> {
  return useMakeQuery({
    queryKey: ["teams"],
    enabled,
    refetchInterval: 60000
  });
}

export function useLeaveTeam(): SpecificUseMutationResult<null> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["teams", "leave"],
      onSuccess: () => {
        // remove players or team
        queryClient?.setQueryData(
          ["achievements", "teams"],
          (old: Array<AchievementTeamType | AchievementTeamExtendedType>) => {
            const teams = [];
            for (const team of old) {
              if ("invite" in team) {
                const myTeam = team as AchievementTeamExtendedType;
                if ((myTeam.players as AchievementPlayerType[]).length !== 1) {
                  teams.push({
                    id: myTeam.id,
                    name: myTeam.name,
                    icon: myTeam.icon,
                    points: myTeam.points,
                  });
                }

                continue;
              }

              teams.push(team);
            }

            return teams;
          }
        );
      },
    },
    {
      method: "DELETE",
    }
  );
}

export function useJoinTeam(): SpecificUseMutationResult<AchievementTeamExtendedType> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["teams", "join"],
      onSuccess: (data) => {
        // update team data for team being joined
        queryClient?.setQueryData(
          ["achievements", "teams"],
          (old: AchievementTeamType[]) =>
            old.map((team) => {
              if (team.id === data.id) {
                return data;
              }
              return team;
            })
        );
      },
    },
    {
      method: "POST",
    }
  );
}

export function useCreateTeam(): SpecificUseMutationResult<AchievementTeamExtendedType> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["teams", "new"],
      onSuccess: (data) => {
        // add team to team list
        queryClient?.setQueryData(
          ["achievements", "teams"],
          (old: AchievementTeamType[]) => old.concat([data])
        );
      },
    },
    {
      method: "POST",
    }
  );
}
