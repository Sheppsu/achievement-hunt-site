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
import { EventContext, EventType } from "contexts/EventContext";
import { UndefinedInitialDataOptions } from "node_modules/@tanstack/react-query/build/legacy";
import { useContext } from "react";
import { AchievementPlayerType } from "./types/AchievementPlayerType";
import {
  AchievementTeamExtendedType,
  AchievementTeamType,
} from "./types/AchievementTeamType";
import { AchievementExtendedType } from "./types/AchievementType";

function getUrl(endpoint: string): string {
  endpoint = endpoint.startsWith("/") ? endpoint : "/" + endpoint;
  endpoint = endpoint.endsWith("/") ? endpoint : endpoint + "/";
  return "/api" + endpoint;
}

async function doFetch<T>(
  dispatchEventMsg: React.Dispatch<{
    type: EventType;
    msg?: string | undefined;
    id?: number | undefined;
  }>,
  endpoint: string,
  init?: RequestInit,
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
  init?: RequestInit,
): UseQueryResult<T> {
  const dispatchEventMsg = useContext(EventContext);
  const endpoint = query.queryKey.join("/");

  query.queryFn = () => doFetch(dispatchEventMsg, endpoint, init);

  return useQuery(queryOptions(query));
}

type SpecificUseMutationResult<T> = UseMutationResult<T, Error, object>;

export function useMakeMutation<T>(
  mutation: UseMutationOptions<T, Error, object, unknown>,
  init?: RequestInit,
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
  enabled: boolean = true,
): UseQueryResult<AchievementExtendedType[]> {
  return useMakeQuery({
    queryKey: ["achievements"],
    enabled,
    refetchInterval: 60000,
  });
}

export function useGetTeams(
  enabled: boolean = true,
): UseQueryResult<Array<AchievementTeamType | AchievementTeamExtendedType>> {
  return useMakeQuery({
    queryKey: ["teams"],
    enabled,
    refetchInterval: 60000,
  });
}

function onLeaveTeam(
  teams: (AchievementTeamType | AchievementTeamExtendedType)[],
) {
  const newTeams = [];

  for (const team of teams) {
    // is the team we're leaving
    if ("invite" in team) {
      // push "minimal" version of team data (if it still exists even)
      if (team.players.length !== 1)
        newTeams.push({
          id: team.id,
          name: team.name,
          icon: team.icon,
          points: team.points,
        });

      continue;
    }

    newTeams.push(team);
  }

  return newTeams;
}

function onRenameTeam(
  teams: (AchievementTeamType | AchievementTeamExtendedType)[],
  newTeamName: string,
) {
  const newTeams = [];

  for (const team of teams) {
    // team to rename
    if ("invite" in team) {
      team.name = newTeamName;
      newTeams.push(team);
      continue;
    }

    newTeams.push(team);
  }

  return newTeams;
}

export function useRenameTeam(): SpecificUseMutationResult<string> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["teams", "rename"],
      onSuccess: (newTeamName) => {
        queryClient?.setQueryData(
          ["teams"],
          (teams: (AchievementTeamType | AchievementTeamExtendedType)[]) =>
            onRenameTeam(teams, newTeamName),
        );
      },
    },
    { method: "PATCH" },
  );
}

export function useLeaveTeam(): SpecificUseMutationResult<null> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["teams", "leave"],
      onSuccess: () => {
        // remove players or team
        queryClient?.setQueryData(["teams"], onLeaveTeam);
      },
    },
    {
      method: "DELETE",
    },
  );
}

function onJoinTeam(
  joinedTeam: AchievementTeamExtendedType,
  teams: AchievementTeamType[],
) {
  return teams.map((team) => (team.id == joinedTeam.id ? joinedTeam : team));
}

export function useJoinTeam(): SpecificUseMutationResult<AchievementTeamExtendedType> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["teams", "join"],
      onSuccess: (joinedTeam) => {
        // update team data for team being joined
        queryClient?.setQueryData(["teams"], (teams: AchievementTeamType[]) =>
          onJoinTeam(joinedTeam, teams),
        );
      },
    },
    {
      method: "POST",
    },
  );
}

export function useCreateTeam(): SpecificUseMutationResult<AchievementTeamExtendedType> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["teams", "create"],
      onSuccess: (newTeam) => {
        // add team to team list
        queryClient?.setQueryData(["teams"], (teams: AchievementTeamType[]) =>
          teams.concat([newTeam]),
        );
      },
    },
    {
      method: "POST",
    },
  );
}
