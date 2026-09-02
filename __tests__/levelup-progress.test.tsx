import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import LevelUpProgressPage from "../pages/levelup/progress";

const mockGetProgress = jest.fn();
const mockGetActivity = jest.fn();
const mockRefresh = jest.fn();
const mockRequestLevelUpAi = jest.fn();
const dashboard = { profile: { user_id: "user-1" } };

jest.mock("../components/levelup/LevelUpShell", () => ({ LevelUpShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("../components/levelup/LevelUpProvider", () => ({ useLevelUp: () => ({ dashboard, loading: false, error: "", refresh: mockRefresh }) }));
jest.mock("../lib/levelup/supabase", () => ({
  getLevelUpProgress: (...args: unknown[]) => mockGetProgress(...args),
  getLevelUpActivity: (...args: unknown[]) => mockGetActivity(...args),
}));
jest.mock("../lib/levelup/ai/client", () => ({
  requestLevelUpAi: (...args: unknown[]) => mockRequestLevelUpAi(...args),
}));

const report = {
  days: 30, from_date: "2026-08-02", to_date: "2026-08-31", period_completions: 4, period_xp: 110,
  daily: [{ date: "2026-08-30", completions: 1, xp: 25 }, { date: "2026-08-31", completions: 2, xp: 85 }],
  stats: [{ key: "strength", xp: 50 }, { key: "vitality", xp: 60 }],
  progress: { total_xp: 110, level: 2, current_streak: 2, best_streak: 4, last_active_date: "2026-08-31" },
};

describe("Level Up progress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProgress.mockResolvedValue(report);
    mockGetActivity
      .mockResolvedValueOnce({ items: [{ id: "completion:1", occurred_at: "2026-08-31T10:00:00Z", type: "mission_completed", title: "Morning training", metadata: { xp_awarded: 25, stat_key: "strength" } }], next_cursor: { at: "2026-08-31T10:00:00Z", id: "completion:1" } })
      .mockResolvedValueOnce({ items: [{ id: "achievement:first", occurred_at: "2026-08-30T10:00:00Z", type: "achievement_unlocked", title: "First Step", metadata: { description: "Complete your first mission." } }], next_cursor: null });
    mockRequestLevelUpAi.mockResolvedValue({
      action: "weekly",
      report: {
        questsCompleted: 4,
        xpEarned: 110,
        currentStreak: 2,
        strongestArea: "Communication",
        needsAttention: "Vitality",
        completionPattern: "Short missions were completed most consistently.",
        recommendation: "Choose two short recovery missions.",
        nextFocus: "Recovery",
      },
    });
  });

  it("renders derived 30-day analytics and paginates activity", async () => {
    render(<LevelUpProgressPage />);
    expect(await screen.findByText("110")).toBeInTheDocument();
    expect(screen.getByText("Morning training")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load next 20" }));
    await waitFor(() => expect(screen.getByText("First Step")).toBeInTheDocument());
    expect(mockGetActivity).toHaveBeenLastCalledWith({ at: "2026-08-31T10:00:00Z", id: "completion:1" });
  });

  it("generates an ephemeral weekly System report on demand", async () => {
    render(<LevelUpProgressPage />);
    await screen.findByText("Morning training");
    expect(mockRequestLevelUpAi).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Analyze Progress" }));
    expect(await screen.findByText("Communication")).toBeInTheDocument();
    expect(screen.getByText("Recovery")).toBeInTheDocument();
    expect(mockRequestLevelUpAi).toHaveBeenCalledWith({ action: "weekly" });
  });

  it("renders a missed-route deduction in the chart and activity log", async () => {
    mockGetProgress.mockResolvedValueOnce({
      ...report,
      period_xp: 85,
      daily: [...report.daily, { date: "2026-09-01", completions: 0, xp: -25 }],
    });
    mockGetActivity.mockReset();
    mockGetActivity.mockResolvedValueOnce({
      items: [{ id: "penalty:1", occurred_at: "2026-09-02T00:00:00Z", type: "daily_focus_missed", title: "Morning training", metadata: { xp_delta: -25, local_date: "2026-09-01" } }],
      next_cursor: null,
    });
    render(<LevelUpProgressPage />);
    expect(await screen.findByText("Missed daily quest · -25 XP")).toBeInTheDocument();
    expect(screen.getByText(/Sep 1 · -25 XP · 0 missions/)).toBeInTheDocument();
  });
});
