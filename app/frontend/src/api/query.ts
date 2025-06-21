import {
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
import {
  ChatMessage,
  WebsocketContext,
  WebsocketContextType,
} from "contexts/WebsocketContext";
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
import { EventIterationType } from "api/types/EventIterationType.ts";
import { AnnouncementType } from "api/types/AnnouncementType.ts";
import { AchievementBatchType } from "api/types/AchievementBatchType.ts";
import { RegistrationType } from "api/types/RegistrationType.ts";
import { TeamInviteType, UserInviteType } from "api/types/InviteType.ts";

function getIterationParams() {
  const path = location.pathname;
  if (!path.startsWith("/iterations/")) {
    return [];
  }

  return ["iterations", path.split("/")[2]];
}

function getUrl(key: string[]): string {
  let params: string | null = null;
  if ((key[key.length - 1] as string).startsWith("?")) {
    params = key[key.length - 1] as string;
    key = key.slice(0, key.length - 1);
  }

  let endpoint = key.join("/");
  endpoint = endpoint.startsWith("/") ? endpoint : "/" + endpoint;
  endpoint = endpoint.endsWith("/") ? endpoint : endpoint + "/";

  if (params !== null) {
    endpoint += params;
  }

  return "/api" + endpoint;
}

async function doFetch<T>(
  dispatchEventMsg: React.Dispatch<{
    type: EventType;
    msg?: string | undefined;
    id?: number | undefined;
  }>,
  key: string[],
  init?: RequestInit,
): Promise<T> {
  const url = getUrl(key);
  const resp = await fetch(url, init);

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
    console.error(`Error fetching ${url}: `, errorMsg);
    throw Error(errorMsg);
  }

  return (await resp.json()).data;
}

export function useMakeQuery<T>(
  query: UndefinedInitialDataOptions<T>,
  init?: RequestInit,
): UseQueryResult<T> {
  const dispatchEventMsg = useContext(EventContext);

  query.queryFn = () =>
    doFetch(dispatchEventMsg, query.queryKey as string[], init);

  return useQuery(queryOptions(query));
}

type SpecificUseMutationResult<T> = UseMutationResult<T, Error, object>;

export function useMakeMutation<T>(
  mutation: UseMutationOptions<T, Error, object, unknown>,
  init?: RequestInit,
): SpecificUseMutationResult<T> {
  const dispatchEventMsg = useContext(EventContext);

  mutation.mutationFn = (data: object) =>
    doFetch(dispatchEventMsg, mutation.mutationKey as string[], {
      body: JSON.stringify(data),
      ...init,
    });

  return useMutation<T, Error, object, unknown>(mutation);
}

export function useGetAchievements(
  enabled: boolean = true,
): UseQueryResult<AchievementExtendedType[]> {
  return useMakeQuery({
    queryKey: [...getIterationParams(), "achievements"],
    enabled,
  });
}

type TeamDataType = {
  placement: number;
  teams: (AchievementTeamType | AchievementTeamExtendedType)[];
};

export function useGetTeams(
  enabled: boolean = true,
): UseQueryResult<TeamDataType> {
  return useMakeQuery({
    queryKey: [...getIterationParams(), "teams"],
    enabled,
    refetchInterval: 60000,
  });
}

function onRenameTeam(teamData: TeamDataType, teamId: number, newName: string) {
  const newTeams = [];

  for (const team of teamData.teams) {
    // team to rename
    if (team.id === teamId) {
      if ("name" in team) {
        team.name = newName;
      }
      newTeams.push(team);
      continue;
    }

    newTeams.push(team);
  }

  return { placement: teamData.placement, teams: newTeams };
}

export function useRenameTeam(): SpecificUseMutationResult<{
  id: number;
  name: string;
}> {
  const queryClient = useContext(QueryClientContext);
  const iteration = getIterationParams();
  return useMakeMutation(
    {
      mutationKey: [...iteration, "teams", "rename"],
      onSuccess: (team) => {
        queryClient?.setQueryData(
          [...iteration, "teams"],
          (teamData: TeamDataType) =>
            onRenameTeam(teamData, team.id, team.name),
        );
      },
    },
    { method: "PATCH" },
  );
}

function onChangeAcceptingFreeAgents(
  teamData: TeamDataType,
  teamId: number,
  enabled: boolean,
) {
  const newTeams = [];

  for (const team of teamData.teams) {
    if (team.id === teamId) {
      if ("name" in team) {
        team.accepts_free_agents = enabled;
      }
      newTeams.push(team);
      continue;
    }

    newTeams.push(team);
  }

  return { placement: teamData.placement, teams: newTeams };
}

export function useChangeAcceptingFreeAgents(): SpecificUseMutationResult<{
  id: number;
  enabled: boolean;
}> {
  const queryClient = useContext(QueryClientContext);
  const iteration = getIterationParams();
  return useMakeMutation(
    {
      mutationKey: [...iteration, "teams", "accept-free-agents"],
      onSuccess: (result) =>
        queryClient?.setQueryData(
          [...iteration, "teams"],
          (teamData: TeamDataType) =>
            onChangeAcceptingFreeAgents(teamData, result.id, result.enabled),
        ),
    },
    {
      method: "PATCH",
    },
  );
}

type TransferTeamAdminType = {
  prevAdminId: number;
  newAdminId: number;
};

function onTransferTeamAdmin(
  data: TransferTeamAdminType,
  teamData: TeamDataType,
) {
  const newTeams = [];

  for (const team of teamData.teams) {
    // team to switch admin
    if ("players" in team) {
      for (const player of team.players) {
        if (player.user.id === data.prevAdminId) {
          player.team_admin = false;
        } else if (player.user.id === data.newAdminId) {
          player.team_admin = true;
        }
      }
    }

    newTeams.push(team);
  }

  return { placement: teamData.placement, teams: newTeams };
}

export function useTransferTeamAdmin(): SpecificUseMutationResult<TransferTeamAdminType> {
  const queryClient = useContext(QueryClientContext);
  return useMakeMutation(
    {
      mutationKey: [...getIterationParams(), "teams", "transfer"],
      onSuccess: (data) => {
        queryClient?.setQueryData(["teams"], (teamData: TeamDataType) =>
          onTransferTeamAdmin(data, teamData),
        );
      },
    },
    { method: "PATCH" },
  );
}

type TeamLeaveDataType = {
  team_id: number;
  user_id: number;
};

function onLeaveTeam(
  wsCtx: WebsocketContextType,
  teamData: TeamDataType,
  leaveData: TeamLeaveDataType,
) {
  const newTeams = [];

  for (const team of teamData.teams) {
    if (team.id === leaveData.team_id) {
      if ((team as AchievementTeamExtendedType).players.length === 1) {
        continue;
      }

      newTeams.push({
        ...team,
        players: (team as AchievementTeamExtendedType).players.filter(
          (player) => player.user.id !== leaveData.user_id,
        ),
      });
      continue;
    }

    newTeams.push(team);
  }

  wsCtx?.resetConnection();

  return { placement: teamData.placement, teams: newTeams };
}

export function useLeaveTeam(): SpecificUseMutationResult<TeamLeaveDataType> {
  const iteration = getIterationParams();
  const queryClient = useContext(QueryClientContext);
  const wsCtx = useContext(WebsocketContext);

  return useMakeMutation(
    {
      mutationKey: [...iteration, "teams", "leave"],
      onSuccess: (leaveData: TeamLeaveDataType) => {
        // remove players or team
        queryClient?.setQueryData(
          [...iteration, "teams"],
          (teamData: TeamDataType) => onLeaveTeam(wsCtx, teamData, leaveData),
        );
      },
    },
    {
      method: "DELETE",
    },
  );
}

export function useCreateTeam(): SpecificUseMutationResult<AchievementTeamExtendedType> {
  const iteration = getIterationParams();
  const queryClient = useContext(QueryClientContext);
  const wsCtx = useContext(WebsocketContext);

  return useMakeMutation(
    {
      mutationKey: [...iteration, "teams", "create"],
      onSuccess: () => {
        queryClient?.invalidateQueries({
          queryKey: [...iteration, "teams"],
        });

        wsCtx?.resetConnection();
      },
    },
    {
      method: "POST",
    },
  );
}

export function useGetTeamInvites(
  enabled: boolean = true,
): UseQueryResult<TeamInviteType[]> {
  const iteration = getIterationParams();

  return useMakeQuery({
    queryKey: [...iteration, "teams", "invites"],
    refetchInterval: 60000,
    enabled,
  });
}

export function useGetUserInvites(): UseQueryResult<UserInviteType[]> {
  const iteration = getIterationParams();

  return useMakeQuery({
    queryKey: [...iteration, "invites"],
  });
}

export function useSendTeamInvite(): SpecificUseMutationResult<TeamInviteType> {
  const iteration = getIterationParams();
  const queryClient = useContext(QueryClientContext);

  return useMakeMutation(
    {
      mutationKey: [...iteration, "teams", "invites", "create"],
      onSuccess: (invite) => {
        queryClient?.setQueryData(
          [...iteration, "teams", "invites"],
          (invites: TeamInviteType[]) => invites.concat([invite]),
        );
      },
    },
    {
      method: "POST",
    },
  );
}

function onInviteDeleted(
  queryKey: string[],
  queryClient: QueryClient | undefined,
  inviteId: number,
) {
  queryClient?.setQueryData(queryKey, (invites: TeamInviteType[]) => {
    const newInvites = [];

    for (const invite of invites) {
      if (invite.id !== inviteId) {
        newInvites.push(invite);
      }
    }

    return newInvites;
  });
}

export function useRescindTeamInvite(
  inviteId: number,
): SpecificUseMutationResult<null> {
  const iteration = getIterationParams();
  const queryClient = useContext(QueryClientContext);

  return useMakeMutation(
    {
      mutationKey: ["invites", inviteId.toString(), "rescind"],
      onSuccess: () =>
        onInviteDeleted(
          [...iteration, "teams", "invites"],
          queryClient,
          inviteId,
        ),
    },
    {
      method: "DELETE",
    },
  );
}

export function useResolveInvite(
  inviteId: number,
): SpecificUseMutationResult<AchievementTeamType | null> {
  const iteration = getIterationParams();
  const queryClient = useContext(QueryClientContext);
  const wsCtx = useContext(WebsocketContext);

  function onInviteResolved(team: AchievementTeamType | null) {
    onInviteDeleted([...iteration, "invites"], queryClient, inviteId);

    if (team === null) {
      return;
    }

    queryClient?.invalidateQueries({
      queryKey: [...iteration, "teams"],
    });

    wsCtx?.resetConnection();
  }

  return useMakeMutation(
    {
      mutationKey: ["invites", inviteId.toString(), "resolve"],
      onSuccess: onInviteResolved,
    },
    {
      method: "DELETE",
    },
  );
}

export function useGetIteration(): UseQueryResult<EventIterationType> {
  const iteration = getIterationParams();

  return useMakeQuery({
    queryKey: iteration.length === 0 ? ["iteration"] : iteration,
    refetchOnMount: false,
  });
}

export function useGetRegistration(
  enabled: boolean = false,
): UseQueryResult<RegistrationType | null> {
  const iteration = getIterationParams();

  return useMakeQuery({
    queryKey: [...iteration, "registration"],
    enabled,
  });
}

export function useRegister(): SpecificUseMutationResult<RegistrationType | null> {
  const iteration = getIterationParams();
  const queryClient = useContext(QueryClientContext);

  return useMakeMutation(
    {
      mutationKey: [...iteration, "registration", "change"],
      onSuccess: (data) => {
        queryClient?.setQueryData([...iteration, "registration"], () => data);
      },
    },
    {
      method: "POST",
    },
  );
}

export function useChangeFreeAgent(): SpecificUseMutationResult<RegistrationType> {
  const iteration = getIterationParams();
  const queryClient = useContext(QueryClientContext);

  return useMakeMutation(
    {
      mutationKey: [...iteration, "registration", "free-agent", "change"],
      onSuccess: (data) => {
        queryClient?.setQueryData([...iteration, "registration"], () => data);
      },
    },
    {
      method: "PATCH",
    },
  );
}

export function useGetAnnouncements(): UseQueryResult<AnnouncementType[]> {
  const iteration = getIterationParams();

  return useMakeQuery({
    queryKey: [...iteration, "announcements"],
  });
}

export function useGetStaffAchievements(
  batch: boolean = false,
  enabled: boolean = true,
): UseQueryResult<StaffAchievementType[]> {
  const params = new URLSearchParams({ batch: batch ? "1" : "0" });
  return useMakeQuery({
    queryKey: [
      ...getIterationParams(),
      "staff",
      "achievements",
      "?" + params.toString(),
    ],
    enabled,
    refetchInterval: 60000,
  });
}

export function useVoteAchievement(
  achievementId: number,
): SpecificUseMutationResult<{ added: boolean }> {
  const queryClient = useContext(QueryClientContext);

  function onVoted(added: boolean) {
    const concatVote = (achievement: StaffAchievementType) => ({
      ...achievement,
      has_voted: added,
      vote_count: achievement.vote_count + (added ? 1 : -1),
    });

    queryClient?.setQueryData(
      ["staff", "achievements", "?batch=0"],
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

  return useMakeMutation(
    {
      mutationKey: ["staff", "achievements", achievementId.toString(), "vote"],
      onSuccess: (result: { added: boolean }) => onVoted(result.added),
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
    ["staff", "achievements", "?batch=0"],
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
    ["staff", "achievements", "?batch=0"],
    (achievements: StaffAchievementType[] | undefined) =>
      achievements?.concat([
        {
          ...achievement,
          batch: null,
          batch_id: null,
          comments: [],
          has_voted: false,
          vote_count: 0,
        },
      ]),
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
    ["staff", "achievements", "?batch=0"],
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
    ["staff", "achievements", "?batch=0"],
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

export function useCreateAnnouncement(): SpecificUseMutationResult<AnnouncementType> {
  const iteration = getIterationParams();
  const queryClient = useContext(QueryClientContext);

  return useMakeMutation(
    {
      mutationKey: [...iteration, "announcements", "create"],
      onSuccess: (announcement) => {
        queryClient?.setQueryData(
          [...iteration, "announcements"],
          (announcements: AnnouncementType[]) =>
            [announcement].concat(announcements),
        );
      },
    },
    {
      method: "POST",
    },
  );
}

export function useGetBatches(
  enabled: boolean = false,
): UseQueryResult<AchievementBatchType[]> {
  return useMakeQuery({
    queryKey: [...getIterationParams(), "batches"],
    enabled,
    refetchOnMount: false,
  });
}

export function useCreateBatch(): SpecificUseMutationResult<AchievementBatchType> {
  const iteration = getIterationParams();
  const queryClient = useContext(QueryClientContext);

  function onBatchCreated(batch: AchievementBatchType) {
    queryClient?.setQueryData(
      [...iteration, "batches"],
      (batches: AchievementBatchType[]) => batches.concat([batch]),
    );
  }

  return useMakeMutation(
    {
      mutationKey: [...iteration, "batches", "create"],
      onSuccess: onBatchCreated,
    },
    {
      method: "POST",
    },
  );
}

export function useMoveAchievement(
  achievementId: number,
): SpecificUseMutationResult<AchievementType> {
  const queryClient = useContext(QueryClientContext);

  function onAchievementMoved(updatedAchievement: AchievementType) {
    queryClient?.setQueryData(
      ["staff", "achievements", "?batch=0"],
      (achievements: StaffAchievementType[]) => {
        const newAchievements = [];

        for (const achievement of achievements) {
          if (achievement.id !== updatedAchievement.id) {
            newAchievements.push(achievement);
          }
        }

        return newAchievements;
      },
    );
  }

  return useMakeMutation(
    {
      mutationKey: ["staff", "achievements", achievementId.toString(), "move"],
      onSuccess: onAchievementMoved,
    },
    {
      method: "PATCH",
    },
  );
}
