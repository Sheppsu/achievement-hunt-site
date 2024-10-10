import { BeatmapInfoType } from "./BeatmapInfoType";
import {AchievementCompletionType, AnonymousAchievementCompletionType} from "api/types/AchievementCompletionType.ts";

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
    completions: (AchievementCompletionType | AnonymousAchievementCompletionType)[];
} & AchievementType;
