import { BeatmapInfoType } from "./BeatmapInfoType";

export type AchievementType = {
    id: number;
    name: string;
    category: string;
    description: string;
    beatmap: BeatmapInfoType | null;
    tags: string;
};

export type AchievementExtendedType = {
    completions: number;
} & AchievementType;