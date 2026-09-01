import { z } from "zod";

import {
  LEVELUP_DIFFICULTY_XP,
  type LevelUpDifficulty,
  type LevelUpMissionInput,
} from "../types";

const compactText = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

export const aiQuestSuggestionSchema = z
  .object({
    title: compactText(1, 120),
    description: compactText(1, 320),
    objectives: z.array(compactText(1, 140)).min(1).max(5),
    cadence: z.enum(["daily", "weekly", "once"]),
    difficulty: z.enum(["easy", "normal", "hard", "epic"]),
    xpReward: z.number().int().min(0).max(10_000),
    statKey: z.enum(["strength", "vitality", "intellect", "discipline"]),
    reasoningSummary: compactText(1, 240),
  })
  .strict();

export const aiQuestListSchema = z
  .object({ suggestions: z.array(aiQuestSuggestionSchema).min(1).max(3) })
  .strict();

export const aiWeeklyReviewSchema = z
  .object({
    strongestArea: compactText(1, 80),
    needsAttention: compactText(1, 80),
    completionPattern: compactText(1, 240),
    recommendation: compactText(1, 320),
    nextFocus: compactText(1, 120),
  })
  .strict();

export const aiCoachResponseSchema = z
  .object({
    answer: compactText(1, 600),
    suggestions: z.array(aiQuestSuggestionSchema).max(3).default([]),
  })
  .strict();

export const levelUpAiRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("quest"), prompt: compactText(3, 800) }).strict(),
  z
    .object({
      action: z.literal("daily"),
      focusArea: compactText(1, 120).optional(),
    })
    .strict(),
  z.object({ action: z.literal("weekly") }).strict(),
  z.object({ action: z.literal("coach"), message: compactText(2, 600) }).strict(),
]);

export type LevelUpAiRequest = z.infer<typeof levelUpAiRequestSchema>;
export type LevelUpAiQuestSuggestion = z.infer<typeof aiQuestSuggestionSchema>;
export type LevelUpAiWeeklyReviewContent = z.infer<typeof aiWeeklyReviewSchema>;
export type LevelUpAiCoachResponse = z.infer<typeof aiCoachResponseSchema>;

export type LevelUpAiWeeklyReview = LevelUpAiWeeklyReviewContent & {
  questsCompleted: number;
  xpEarned: number;
  currentStreak: number;
};

export type LevelUpAiQuestResponse = {
  suggestions: LevelUpAiQuestSuggestion[];
};

export type LevelUpAiResponse =
  | ({ action: "quest" | "daily" } & LevelUpAiQuestResponse)
  | ({ action: "weekly"; report: LevelUpAiWeeklyReview })
  | ({ action: "coach" } & LevelUpAiCoachResponse);

export function normalizeQuestSuggestion(
  suggestion: LevelUpAiQuestSuggestion
): LevelUpAiQuestSuggestion {
  return {
    ...suggestion,
    xpReward: LEVELUP_DIFFICULTY_XP[suggestion.difficulty],
  };
}

export function normalizeQuestSuggestions(
  suggestions: LevelUpAiQuestSuggestion[]
): LevelUpAiQuestSuggestion[] {
  return suggestions.map(normalizeQuestSuggestion);
}

export function suggestionToMissionInput(
  suggestion: LevelUpAiQuestSuggestion
): LevelUpMissionInput {
  const objectives = suggestion.objectives.map((item) => `• ${item}`).join("\n");
  const description = `${suggestion.description}\n\nObjectives:\n${objectives}`.slice(0, 500);

  return {
    title: suggestion.title,
    description,
    cadence: suggestion.cadence,
    difficulty: suggestion.difficulty as LevelUpDifficulty,
    stat_key: suggestion.statKey,
  };
}

