import type {
  LevelUpAiCoachResponse,
  LevelUpAiQuestResponse,
  LevelUpAiWeeklyReviewContent,
} from "./schemas";

export type LevelUpAiContext = {
  level: number;
  currentXp: number;
  currentStreak: number;
  stats: Array<{ key: string; xp: number }>;
  unfinishedMissions: Array<{
    title: string;
    cadence: string;
    difficulty: string;
    statKey: string;
  }>;
  recentCompletions: Array<{
    title: string;
    xp: number;
    statKey: string;
    date?: string;
  }>;
  lastSevenDays: {
    completions: number;
    xp: number;
  };
};

export interface LevelUpAiProvider {
  generateQuestSuggestions(
    prompt: string,
    context: LevelUpAiContext
  ): Promise<LevelUpAiQuestResponse>;
  generateDailyMissions(
    focusArea: string | undefined,
    context: LevelUpAiContext
  ): Promise<LevelUpAiQuestResponse>;
  generateWeeklyReview(
    context: LevelUpAiContext
  ): Promise<LevelUpAiWeeklyReviewContent>;
  answerCoach(
    message: string,
    context: LevelUpAiContext
  ): Promise<LevelUpAiCoachResponse>;
}

export type LevelUpAiErrorCode =
  | "not_configured"
  | "timeout"
  | "quota_exceeded"
  | "safety_rejection"
  | "invalid_response"
  | "provider_unavailable";

export class LevelUpAiProviderError extends Error {
  constructor(
    public readonly code: LevelUpAiErrorCode,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "LevelUpAiProviderError";
  }
}

