export const LEVELUP_GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-3.0-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.5-pro",
] as const;

export type LevelUpGeminiModel = (typeof LEVELUP_GEMINI_MODELS)[number];

export function isLevelUpGeminiModel(value: string): value is LevelUpGeminiModel {
  return (LEVELUP_GEMINI_MODELS as readonly string[]).includes(value);
}
