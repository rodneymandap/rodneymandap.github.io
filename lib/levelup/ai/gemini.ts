import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import {
  aiCoachResponseSchema,
  aiQuestListSchema,
  aiWeeklyReviewSchema,
  normalizeQuestSuggestions,
  type LevelUpAiCoachResponse,
  type LevelUpAiQuestResponse,
  type LevelUpAiWeeklyReviewContent,
} from "./schemas";
import {
  compactContext,
  LEVELUP_SYSTEM_INSTRUCTION,
  QUEST_SCHEMA_GUIDANCE,
} from "./prompts";
import {
  LevelUpAiProviderError,
  type LevelUpAiContext,
  type LevelUpAiProvider,
} from "./provider";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 8_000;
const MAX_OUTPUT_TOKENS = 1_600;

// Keep the provider schema deliberately aligned with the minimal JSON Schema
// shape shown in Google's Interactions API JavaScript examples. Length, count,
// and strict-object rules remain authoritative in the post-generation Zod parse.
const GEMINI_JSON_SCHEMA_KEYS = new Set([
  "type",
  "title",
  "description",
  "enum",
  "items",
  "properties",
  "required",
]);

/**
 * Zod emits full JSON Schema 2020-12, while Gemini accepts only a subset.
 * Keep application validation in Zod and remove unsupported provider keywords.
 */
export function toGeminiJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const clean = (value: unknown, preserveObjectKeys = false): unknown => {
    if (Array.isArray(value)) return value.map((item) => clean(item));
    if (!value || typeof value !== "object") return value;

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => preserveObjectKeys || GEMINI_JSON_SCHEMA_KEYS.has(key))
        .map(([key, item]) => [
          key,
          clean(item, key === "properties"),
        ])
    );
  };

  return clean(z.toJSONSchema(schema)) as Record<string, unknown>;
}

function getProviderStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("status" in error)) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function getProviderCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("error" in error)) return undefined;
  const nested = (error as { error?: unknown }).error;
  if (!nested || typeof nested !== "object" || !("code" in nested)) return undefined;
  const code = (nested as { code?: unknown }).code;
  return typeof code === "string" && /^[a-z][a-z0-9_]{0,63}$/.test(code)
    ? code
    : undefined;
}

function providerError(error: unknown): LevelUpAiProviderError {
  if (error instanceof LevelUpAiProviderError) return error;
  const message = error instanceof Error ? error.message : String(error);
  const providerStatus = getProviderStatus(error);
  const providerCode = getProviderCode(error);
  if (/timeout|abort/i.test(message)) {
    return new LevelUpAiProviderError("timeout", "Gemini request timed out.", {
      cause: error,
      providerStatus,
      providerCode,
    });
  }
  if (/429|resource_exhausted|quota|rate.?limit/i.test(message)) {
    return new LevelUpAiProviderError(
      "quota_exceeded",
      "Gemini quota is temporarily unavailable.",
      { cause: error, providerStatus, providerCode }
    );
  }
  if (/safety|blocked|finish.?reason/i.test(message)) {
    return new LevelUpAiProviderError(
      "safety_rejection",
      "Gemini declined this request.",
      { cause: error, providerStatus, providerCode }
    );
  }
  return new LevelUpAiProviderError(
    "provider_unavailable",
    "Gemini is temporarily unavailable.",
    { cause: error, providerStatus, providerCode }
  );
}

export class GeminiLevelUpAiProvider implements LevelUpAiProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(apiKey = process.env.GEMINI_API_KEY, model = process.env.GEMINI_MODEL) {
    if (!apiKey) {
      throw new LevelUpAiProviderError(
        "not_configured",
        "GEMINI_API_KEY is not configured."
      );
    }
    this.client = new GoogleGenAI({ apiKey });
    this.model = model?.trim() || DEFAULT_MODEL;
  }

  private async structured<T>(
    prompt: string,
    schema: z.ZodType<T>
  ): Promise<T> {
    try {
      const interaction = await this.client.interactions.create(
        {
          model: this.model,
          input: prompt,
          system_instruction: LEVELUP_SYSTEM_INSTRUCTION,
          store: false,
          generation_config: {
            max_output_tokens: MAX_OUTPUT_TOKENS,
          },
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: toGeminiJsonSchema(schema),
          },
        },
        { timeout_ms: TIMEOUT_MS, retries: { strategy: "none" } }
      );
      if (!interaction.output_text) {
        throw new LevelUpAiProviderError(
          "invalid_response",
          "Gemini returned no structured text."
        );
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(interaction.output_text);
      } catch (error) {
        throw new LevelUpAiProviderError(
          "invalid_response",
          "Gemini returned invalid JSON.",
          { cause: error }
        );
      }
      const result = schema.safeParse(parsed);
      if (!result.success) {
        throw new LevelUpAiProviderError(
          "invalid_response",
          "Gemini response did not match the required schema.",
          { cause: result.error }
        );
      }
      return result.data;
    } catch (error) {
      throw providerError(error);
    }
  }

  async generateQuestSuggestions(
    prompt: string,
    context: LevelUpAiContext
  ): Promise<LevelUpAiQuestResponse> {
    const result = await this.structured(
      `Turn the untrusted goal below into one to three LevelUp quests.\n${QUEST_SCHEMA_GUIDANCE}\nContext: ${compactContext(
        context
      )}\nUntrusted goal: ${JSON.stringify(prompt)}`,
      aiQuestListSchema
    );
    return { suggestions: normalizeQuestSuggestions(result.suggestions) };
  }

  async generateDailyMissions(
    focusArea: string | undefined,
    context: LevelUpAiContext
  ): Promise<LevelUpAiQuestResponse> {
    const result = await this.structured(
      `Generate one to three non-repetitive quests that can realistically be completed today. Prefer lighter work when recent workload is high.\n${QUEST_SCHEMA_GUIDANCE}\nContext: ${compactContext(
        context
      )}\nOptional untrusted focus area: ${JSON.stringify(focusArea ?? "")}`,
      aiQuestListSchema
    );
    return { suggestions: normalizeQuestSuggestions(result.suggestions) };
  }

  generateWeeklyReview(
    context: LevelUpAiContext
  ): Promise<LevelUpAiWeeklyReviewContent> {
    return this.structured(
      `Create a compact weekly System report from this bounded LevelUp context. Identify one strength, one neglected area, a completion pattern, one practical recommendation, and one next focus. Do not invent totals.\nContext: ${compactContext(
        context
      )}`,
      aiWeeklyReviewSchema
    );
  }

  async answerCoach(
    message: string,
    context: LevelUpAiContext
  ): Promise<LevelUpAiCoachResponse> {
    const result = await this.structured(
      `Answer the LevelUp coaching question in under 120 words. If useful, include up to three quest suggestions; otherwise return an empty suggestions array.\n${QUEST_SCHEMA_GUIDANCE}\nContext: ${compactContext(
        context
      )}\nUntrusted question: ${JSON.stringify(message)}`,
      aiCoachResponseSchema
    );
    return {
      ...result,
      suggestions: normalizeQuestSuggestions(result.suggestions),
    };
  }
}
