import {UserType} from "api/types/UserType.ts";

export type AchievementCompletionType = {
    time_completed: string;
    player: { id: number, user: UserType };
    placement?: AchievementCompletionPlacementType
};

export type AnonymousAchievementCompletionType = {
    placement: AchievementCompletionPlacementType
};

export type AchievementCompletionPlacementType = {
    value: number;
    place: number;
}
