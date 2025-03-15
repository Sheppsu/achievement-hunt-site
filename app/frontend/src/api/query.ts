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
import {
  AchievementTeamExtendedType,
  AchievementTeamType,
} from "./types/AchievementTeamType";
import {
  AchievementExtendedType,
  AchievementType,
  StaffAchievementType,
} from "./types/AchievementType";
import { AchievementCommentType } from "api/types/AchievementCommentType.ts";
import { UserType } from "api/types/UserType.ts";

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

type TransferTeamAdminType = {
  prevAdminId: number;
  newAdminId: number;
};

function onTransferTeamAdmin(
  data: TransferTeamAdminType,
  teams: (AchievementTeamType | AchievementTeamExtendedType)[],
) {
  const newTeams = [];

  for (const team of teams) {
    // team to switch admin
    if ("invite" in team) {
      for (const player of team.players) {
        if (player.user.id === data.prevAdminId) {
          player.team_admin = false;
        } else if (player.user.id === data.newAdminId) {
          player.team_admin = true;
        }
      }
      newTeams.push(team);

      continue;
    }

    newTeams.push(team);
  }

  return newTeams;
}
export function useTransferTeamAdmin(): SpecificUseMutationResult<TransferTeamAdminType> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["teams", "transfer"],
      onSuccess: (data) => {
        queryClient?.setQueryData(
          ["teams"],
          (teams: (AchievementTeamType | AchievementTeamExtendedType)[]) =>
            onTransferTeamAdmin(data, teams),
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

export function useGetStaffAchievement(
  enabled: boolean = true,
): UseQueryResult<StaffAchievementType[]> {
  return useMakeQuery({
    queryKey: ["staff", "achievements"],
    enabled,
    refetchInterval: 60000,
  });
}

function onVoted(
  achievements: StaffAchievementType[],
  achievementId: number,
  added: boolean,
) {
  const newAchievements = [];

  for (const achievement of achievements) {
    if (achievement.id === achievementId) {
      newAchievements.push({
        ...achievement,
        has_voted: added,
        vote_count: achievement.vote_count + (added ? 1 : -1),
      });
      continue;
    }

    newAchievements.push(achievement);
  }

  return newAchievements;
}

export function useVoteAchievement(
  achievementId: number,
): SpecificUseMutationResult<{ added: boolean }> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["staff", "achievements", achievementId.toString(), "vote"],
      onSuccess: (result: { added: boolean }) => {
        queryClient?.setQueryData(
          ["staff", "achievements"],
          (achievements: StaffAchievementType[]) =>
            onVoted(achievements, achievementId, result.added),
        );
      },
    },
    {
      method: "POST",
    },
  );
}

function onCommented(
  achievements: StaffAchievementType[],
  achievementId: number,
  comment: AchievementCommentType,
) {
  const newAchievements = [];

  for (const achievement of achievements) {
    if (achievement.id === achievementId) {
      newAchievements.push({
        ...achievement,
        comments: achievement.comments.concat([comment]),
      });
      continue;
    }

    newAchievements.push(achievement);
  }

  return newAchievements;
}

export function useSendComment(
  achievementId: number,
): SpecificUseMutationResult<AchievementCommentType> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: [
        "staff",
        "achievements",
        achievementId.toString(),
        "comment",
      ],
      onSuccess: (result: AchievementCommentType) => {
        queryClient?.setQueryData(
          ["staff", "achievements"],
          (achievements: StaffAchievementType[]) =>
            onCommented(achievements, achievementId, result),
        );
      },
    },
    {
      method: "POST",
    },
  );
}

type AchievementCreationReturn = AchievementType & {
  solution: string;
  creator: UserType;
};

function onAchievementCreation(
  achievements: StaffAchievementType[],
  achievement: AchievementCreationReturn,
) {
  return achievements.concat({
    ...achievement,
    comments: [],
    vote_count: 0,
    has_voted: false,
  });
}

export function useCreateAchievement(): SpecificUseMutationResult<AchievementCreationReturn> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["staff", "achievements", "create"],
      onSuccess: (result: AchievementCreationReturn) => {
        queryClient?.setQueryData(
          ["staff", "achievements"],
          (achievements: StaffAchievementType[]) =>
            onAchievementCreation(achievements, result),
        );
      },
    },
    {
      method: "POST",
    },
  );
}
