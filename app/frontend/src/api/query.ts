import {
  MutationKey,
  QueryClient,
  QueryClientContext,
  UseMutationOptions,
  UseMutationResult,
  UseQueryResult,
  queryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { AchievementCommentType } from "api/types/AchievementCommentType.ts";
import { UserType } from "api/types/UserType.ts";
import { EventContext, EventType } from "contexts/EventContext";
import { ChatMessage } from "contexts/WebsocketContext";
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
  queryClient: QueryClient | undefined,
  joinedTeam: AchievementTeamExtendedType,
) {
  // update team data for team being joined
  queryClient?.setQueryData(
    ["teams"],
    (teams: AchievementTeamType[] | undefined) =>
      teams?.map((team) => (team.id == joinedTeam.id ? joinedTeam : team)),
  );
  return;
}

export function useJoinTeam(): SpecificUseMutationResult<AchievementTeamExtendedType> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["teams", "join"],
      onSuccess: (joinedTeam) => onJoinTeam(queryClient, joinedTeam),
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

export function useGetStaffAchievements(
  enabled: boolean = true,
): UseQueryResult<StaffAchievementType[]> {
  return useMakeQuery({
    queryKey: ["staff", "achievements"],
    enabled,
    refetchInterval: 60000,
  });
}

function onVoted(
  queryClient: QueryClient | undefined,
  achievementId: number,
  added: boolean,
) {
  const concatVote = (achievement: StaffAchievementType) => ({
    ...achievement,
    has_voted: added,
    vote_count: achievement.vote_count + (added ? 1 : -1),
  });

  queryClient?.setQueryData(
    ["staff", "achievements"],
    (achievements: StaffAchievementType[] | undefined) => {
      if (achievements === undefined) return;

      const newAchievements = [];

      for (const achievement of achievements) {
        if (achievement.id === achievementId) {
          newAchievements.push(concatVote(achievement));
          continue;
        }

        newAchievements.push(achievement);
      }

      return newAchievements;
    },
  );

  queryClient?.setQueryData(
    ["staff", "achievements", achievementId.toString()],
    (achievement: StaffAchievementType | undefined) =>
      achievement === undefined ? undefined : concatVote(achievement),
  );
}

export function useVoteAchievement(
  achievementId: number,
): SpecificUseMutationResult<{ added: boolean }> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["staff", "achievements", achievementId.toString(), "vote"],
      onSuccess: (result: { added: boolean }) =>
        onVoted(queryClient, achievementId, result.added),
    },
    {
      method: "POST",
    },
  );
}

function onCommented(
  queryClient: QueryClient | undefined,
  achievementId: number,
  comment: AchievementCommentType,
) {
  const concatComment = (achievement: StaffAchievementType) => ({
    ...achievement,
    comments: achievement.comments.concat([comment]),
  });

  queryClient?.setQueryData(
    ["staff", "achievements"],
    (achievements: StaffAchievementType[] | undefined) => {
      if (achievements === undefined) return;

      const newAchievements = [];

      for (const achievement of achievements) {
        if (achievement.id === achievementId) {
          newAchievements.push(concatComment(achievement));
          continue;
        }

        newAchievements.push(achievement);
      }

      return newAchievements;
    },
  );

  queryClient?.setQueryData(
    ["staff", "achievements", achievementId.toString()],
    (achievement: StaffAchievementType | undefined) =>
      achievement === undefined ? undefined : concatComment(achievement),
  );
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
      onSuccess: (result: AchievementCommentType) =>
        onCommented(queryClient, achievementId, result),
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
  queryClient: QueryClient | undefined,
  achievement: AchievementCreationReturn,
) {
  queryClient?.setQueryData(
    ["staff", "achievements"],
    (achievements: StaffAchievementType[] | undefined) =>
      achievements?.concat({
        ...achievement,
        comments: [],
        vote_count: 0,
        has_voted: false,
      }),
  );
}

export function useCreateAchievement(): SpecificUseMutationResult<AchievementCreationReturn> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["staff", "achievements", "create"],
      onSuccess: (result: AchievementCreationReturn) =>
        onAchievementCreation(queryClient, result),
    },
    {
      method: "POST",
    },
  );
}

function onAchievementEdit(
  queryClient: QueryClient | undefined,
  editedAchievement: AchievementCreationReturn,
) {
  const combineAchievements = (achievement: StaffAchievementType) => ({
    ...editedAchievement,
    comments: achievement.comments,
    vote_count: achievement.vote_count,
    has_voted: achievement.has_voted,
  });

  queryClient?.setQueryData(
    ["staff", "achievements"],
    (achievements: StaffAchievementType[] | undefined) => {
      if (achievements === undefined) return;

      const newAchievements = [];

      for (const achievement of achievements) {
        if (achievement.id === editedAchievement.id) {
          newAchievements.push(combineAchievements(achievement));
          continue;
        }

        newAchievements.push(achievement);
      }

      return newAchievements;
    },
  );

  queryClient?.setQueryData(
    ["staff", "achievements", editedAchievement.id.toString()],
    (achievement: StaffAchievementType | undefined) =>
      achievement === undefined ? undefined : combineAchievements(achievement),
  );
}

export function useEditAchievement(
  achievementId: number,
): SpecificUseMutationResult<AchievementCreationReturn> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: ["staff", "achievements", achievementId.toString(), "edit"],
      onSuccess: (result: AchievementCreationReturn) =>
        onAchievementEdit(queryClient, result),
    },
    {
      method: "POST",
    },
  );
}

function onAchievementDeleted(
  queryClient: QueryClient | undefined,
  achievementId: number,
) {
  queryClient?.setQueryData(
    ["staff", "achievements"],
    (achievements: StaffAchievementType[] | undefined) =>
      achievements?.filter((achievement) => achievement.id != achievementId),
  );

  queryClient?.invalidateQueries({
    queryKey: ["staff", "achievements", achievementId.toString()],
  });
}

export function useDeleteAchievement(achievementId: number) {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: [
        "staff",
        "achievements",
        achievementId.toString(),
        "delete",
      ],
      onSuccess: () => onAchievementDeleted(queryClient, achievementId),
    },
    {
      method: "DELETE",
    },
  );
}

export function useGetStaffAchievement(
  achievementId: number,
  enabled: boolean = true,
): UseQueryResult<StaffAchievementType> {
  return useMakeQuery({
    queryKey: ["staff", "achievements", achievementId.toString()],
    enabled,
    refetchInterval: 60000,
  });
}

export function useGetTeamMessages(): UseQueryResult<ChatMessage[]> {
  return useMakeQuery({
    queryKey: ["teams", "messages"],
  });
}
