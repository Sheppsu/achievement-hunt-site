import { BeatmapInfoType } from "./BeatmapInfoType";
import {UserType} from "api/types/UserType.ts";

export type AchievementType = {
    id: number;
    name: string;
    category: string;
    description: string;
    beatmap: BeatmapInfoType | null;
    tags: string;
};

export type AchievementExtendedType = {
    completion_count: number;
    completions: AchievementCompletionType[];
} & AchievementType;

export type AchievementCompletionType = {
    time_completed: string;
    player: { id: number, user: UserType };
    placement?: { value: number }
};