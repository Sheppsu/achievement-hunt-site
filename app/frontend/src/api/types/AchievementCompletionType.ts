export type AchievementCompletionType = {
    time_completed: string;
    achievement_id: number;
    placement: {value: number} | null;
};