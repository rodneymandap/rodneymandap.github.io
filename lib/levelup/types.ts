export type LevelUpCadence = "daily" | "weekly" | "once";
export type LevelUpDifficulty = "easy" | "normal" | "hard" | "epic";
export type LevelUpStatKey =
  | "strength"
  | "vitality"
  | "intellect"
  | "discipline";

export type LevelUpMission = {
  id: string;
  title: string;
  description: string;
  cadence: LevelUpCadence;
  difficulty: LevelUpDifficulty;
  stat_key: LevelUpStatKey;
  xp_reward: number;
  active: boolean;
  archived_at: string | null;
  created_at: string;
  completed: boolean;
};

export type LevelUpStat = {
  key: LevelUpStatKey;
  xp: number;
};

export type LevelUpProgress = {
  total_xp: number;
  level: number;
  xp_into_level: number;
  xp_for_next_level: number;
  current_streak: number;
  best_streak: number;
  last_active_date: string | null;
};

export type LevelUpDashboard = {
  profile: {
    user_id: string;
    timezone: string;
  };
  local_date: string;
  progress: LevelUpProgress;
  stats: LevelUpStat[];
  missions: LevelUpMission[];
};

export type LevelUpAchievementEvent = {
  slug: string;
  title: string;
  description: string;
  icon_key: string;
};

export type LevelUpMutationResult = LevelUpDashboard & {
  event: {
    type: "mission_completed" | "mission_undone";
    mission_id: string;
    completion_id: string;
    xp_awarded?: number;
    stat_key?: LevelUpStatKey;
    new_achievements?: LevelUpAchievementEvent[];
  };
};

export type LevelUpMissionInput = {
  title: string;
  description: string;
  cadence: LevelUpCadence;
  difficulty: LevelUpDifficulty;
  stat_key: LevelUpStatKey;
};

export type LevelUpDailyProgress = {
  date: string;
  completions: number;
  xp: number;
};

export type LevelUpProgressReport = {
  days: number;
  from_date: string;
  to_date: string;
  period_completions: number;
  period_xp: number;
  daily: LevelUpDailyProgress[];
  stats: LevelUpStat[];
  progress: Pick<
    LevelUpProgress,
    "total_xp" | "level" | "current_streak" | "best_streak" | "last_active_date"
  >;
};

export type LevelUpActivityItem = {
  id: string;
  occurred_at: string;
  type: "mission_completed" | "achievement_unlocked";
  title: string;
  metadata: {
    xp_awarded?: number;
    stat_key?: LevelUpStatKey;
    local_date?: string;
    achievement_slug?: string;
    description?: string;
    icon_key?: string;
  };
};

export type LevelUpActivityPage = {
  items: LevelUpActivityItem[];
  next_cursor: { at: string; id: string } | null;
};

export type LevelUpAchievement = {
  slug: string;
  title: string;
  description: string;
  icon_key: string;
  criteria_type: "completion_count" | "streak" | "level" | "stat_xp";
  threshold: number;
  stat_key: LevelUpStatKey | null;
  unlocked: boolean;
  unlocked_at: string | null;
};

export const LEVELUP_STAT_LABELS: Record<LevelUpStatKey, string> = {
  strength: "Strength",
  vitality: "Vitality",
  intellect: "Intellect",
  discipline: "Discipline",
};

export const LEVELUP_CADENCE_LABELS: Record<LevelUpCadence, string> = {
  daily: "Daily mission",
  weekly: "Weekly mission",
  once: "Main quest",
};

export const LEVELUP_DIFFICULTY_XP: Record<LevelUpDifficulty, number> = {
  easy: 10,
  normal: 25,
  hard: 50,
  epic: 100,
};
