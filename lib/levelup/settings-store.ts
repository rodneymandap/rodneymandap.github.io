import type { SupabaseClient } from "@supabase/supabase-js";

import { isLevelUpGeminiModel, type LevelUpGeminiModel } from "./ai/models";

const SETTINGS_TABLE = "levelup_settings";
const MODEL_KEY = "gemini_model";

type SettingsRow = {
  value?: { gemini_model?: string | null } | string | null;
};

function readStoredModel(row: SettingsRow | null | undefined): LevelUpGeminiModel | null {
  const stored =
    typeof row?.value === "string"
      ? row.value
      : row?.value?.gemini_model ?? null;
  const normalized = stored?.trim();
  return normalized && isLevelUpGeminiModel(normalized) ? normalized : null;
}

export async function loadLevelUpGeminiModel(
  supabase: SupabaseClient
): Promise<LevelUpGeminiModel | null> {
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select("value")
    .eq("key", MODEL_KEY)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return readStoredModel(data as SettingsRow | null);
}

export async function saveLevelUpGeminiModel(
  supabase: SupabaseClient,
  model: LevelUpGeminiModel | null
): Promise<void> {
  const { error } = await supabase.from(SETTINGS_TABLE).upsert(
    {
      key: MODEL_KEY,
      value: { gemini_model: model },
    },
    { onConflict: "key" }
  );

  if (error) throw new Error(error.message);
}

