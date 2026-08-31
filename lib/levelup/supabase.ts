import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  LevelUpAchievement,
  LevelUpActivityPage,
  LevelUpDashboard,
  LevelUpMissionInput,
  LevelUpMutationResult,
  LevelUpProgressReport,
} from "./types";

let browserClient: SupabaseClient | null = null;

export function hasLevelUpSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function getLevelUpSupabaseClient(): SupabaseClient {
  if (!hasLevelUpSupabaseConfig()) {
    throw new Error(
      "Level Up is not configured. Add the Supabase URL and publishable key."
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string
    );
  }

  return browserClient;
}

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) {
    throw new Error(error.message);
  }
  if (data === null) {
    throw new Error("Level Up returned an empty response.");
  }
  return data;
}

export async function getLevelUpDashboard(): Promise<LevelUpDashboard> {
  const { data, error } = await getLevelUpSupabaseClient().rpc(
    "get_levelup_dashboard"
  );
  return unwrap(data as LevelUpDashboard | null, error);
}

export async function completeLevelUpMission(
  missionId: string
): Promise<LevelUpMutationResult> {
  const { data, error } = await getLevelUpSupabaseClient().rpc(
    "complete_levelup_mission",
    { p_mission_id: missionId }
  );
  return unwrap(data as LevelUpMutationResult | null, error);
}

export async function undoLevelUpMission(
  missionId: string
): Promise<LevelUpMutationResult> {
  const { data, error } = await getLevelUpSupabaseClient().rpc(
    "undo_levelup_mission",
    { p_mission_id: missionId }
  );
  return unwrap(data as LevelUpMutationResult | null, error);
}

export async function setLevelUpDailyFocus(
  missionIds: string[]
): Promise<LevelUpDashboard> {
  const { data, error } = await getLevelUpSupabaseClient().rpc(
    "set_levelup_daily_focus",
    { p_mission_ids: missionIds }
  );
  return unwrap(data as LevelUpDashboard | null, error);
}

export async function createLevelUpMission(
  userId: string,
  input: LevelUpMissionInput
): Promise<void> {
  const { error } = await getLevelUpSupabaseClient()
    .from("levelup_missions")
    .insert({ user_id: userId, ...input });
  if (error) throw new Error(error.message);
}

export async function updateLevelUpMission(
  missionId: string,
  input: LevelUpMissionInput
): Promise<void> {
  const { error } = await getLevelUpSupabaseClient()
    .from("levelup_missions")
    .update(input)
    .eq("id", missionId);
  if (error) throw new Error(error.message);
}

export async function setLevelUpMissionArchived(
  missionId: string,
  archived: boolean
): Promise<void> {
  const { error } = await getLevelUpSupabaseClient()
    .from("levelup_missions")
    .update({
      active: !archived,
      archived_at: archived ? new Date().toISOString() : null,
    })
    .eq("id", missionId);
  if (error) throw new Error(error.message);
}

export async function getLevelUpMissions(includeArchived = false) {
  let query = getLevelUpSupabaseClient()
    .from("levelup_missions")
    .select("*")
    .order("created_at", { ascending: false });
  if (!includeArchived) query = query.eq("active", true);
  const { data, error } = await query;
  return unwrap(data, error);
}

export async function getLevelUpProgress(
  days = 30
): Promise<LevelUpProgressReport> {
  const { data, error } = await getLevelUpSupabaseClient().rpc(
    "get_levelup_progress",
    { p_days: days }
  );
  return unwrap(data as LevelUpProgressReport | null, error);
}

export async function getLevelUpActivity(
  cursor?: { at: string; id: string } | null
): Promise<LevelUpActivityPage> {
  const { data, error } = await getLevelUpSupabaseClient().rpc(
    "get_levelup_activity",
    {
      p_limit: 20,
      p_cursor_at: cursor?.at ?? null,
      p_cursor_id: cursor?.id ?? null,
    }
  );
  return unwrap(data as LevelUpActivityPage | null, error);
}

export async function getLevelUpAchievements(): Promise<LevelUpAchievement[]> {
  const { data, error } = await getLevelUpSupabaseClient().rpc(
    "get_levelup_achievements"
  );
  return unwrap(data as LevelUpAchievement[] | null, error);
}

export function resetLevelUpSupabaseClientForTests(): void {
  browserClient = null;
}
