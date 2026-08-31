import { createBrowserClient } from "@supabase/ssr";

import {
  completeLevelUpMission,
  createLevelUpMission,
  getLevelUpAchievements,
  getLevelUpActivity,
  getLevelUpDashboard,
  getLevelUpMissions,
  getLevelUpProgress,
  getLevelUpSupabaseClient,
  hasLevelUpSupabaseConfig,
  resetLevelUpSupabaseClientForTests,
  setLevelUpDailyFocus,
  setLevelUpMissionArchived,
  undoLevelUpMission,
  updateLevelUpMission,
} from "../lib/levelup/supabase";

jest.mock("@supabase/ssr", () => ({ createBrowserClient: jest.fn() }));

const mockRpc = jest.fn();
const mockInsert = jest.fn();
const mockUpdateEq = jest.fn();
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));
const mockSelect = jest.fn();
const mockFrom = jest.fn(() => ({ insert: mockInsert, update: mockUpdate, select: mockSelect }));
const mockClient = { rpc: mockRpc, from: mockFrom };

describe("Level Up Supabase interface", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    resetLevelUpSupabaseClientForTests();
    (createBrowserClient as jest.Mock).mockReturnValue(mockClient);
    mockInsert.mockResolvedValue({ error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockRpc.mockImplementation((name: string) => Promise.resolve({ data: { name }, error: null }));

    const ordered = Object.assign(
      Promise.resolve({ data: [{ id: "mission-1" }], error: null }),
      { eq: jest.fn().mockResolvedValue({ data: [{ id: "mission-1" }], error: null }) }
    );
    mockSelect.mockReturnValue({ order: jest.fn().mockReturnValue(ordered) });
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
  });

  it("creates one cookie-aware browser client from public credentials", () => {
    expect(hasLevelUpSupabaseConfig()).toBe(true);
    const first = getLevelUpSupabaseClient();
    const second = getLevelUpSupabaseClient();
    expect(first).toBe(second);
    expect(createBrowserClient).toHaveBeenCalledWith("https://example.supabase.co", "publishable-key");
  });

  it("rejects usage when configuration is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    resetLevelUpSupabaseClientForTests();
    expect(hasLevelUpSupabaseConfig()).toBe(false);
    expect(() => getLevelUpSupabaseClient()).toThrow(/not configured/i);
  });

  it("uses the consolidated RPC interface", async () => {
    await getLevelUpDashboard();
    await completeLevelUpMission("mission-1");
    await undoLevelUpMission("mission-1");
    await setLevelUpDailyFocus(["mission-1", "mission-2"]);
    await getLevelUpProgress(30);
    await getLevelUpActivity({ at: "2026-08-31T00:00:00Z", id: "completion:1" });
    await getLevelUpAchievements();
    expect(mockRpc.mock.calls.map((call) => call[0])).toEqual([
      "get_levelup_dashboard",
      "complete_levelup_mission",
      "undo_levelup_mission",
      "set_levelup_daily_focus",
      "get_levelup_progress",
      "get_levelup_activity",
      "get_levelup_achievements",
    ]);
    expect(mockRpc).toHaveBeenCalledWith("set_levelup_daily_focus", {
      p_mission_ids: ["mission-1", "mission-2"],
    });
  });

  it("creates, edits, archives, and reads missions through RLS-protected tables", async () => {
    const input = { title: "Train", description: "", cadence: "daily" as const, difficulty: "easy" as const, stat_key: "strength" as const };
    await createLevelUpMission("user-1", input);
    await updateLevelUpMission("mission-1", input);
    await setLevelUpMissionArchived("mission-1", true);
    const missions = await getLevelUpMissions(true);
    expect(mockInsert).toHaveBeenCalledWith({ user_id: "user-1", ...input });
    expect(mockUpdate).toHaveBeenCalledWith(input);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
    expect(missions).toEqual([{ id: "mission-1" }]);
  });

  it("propagates database errors without inventing local progress", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "RLS denied" } });
    await expect(getLevelUpDashboard()).rejects.toThrow("RLS denied");
  });
});
