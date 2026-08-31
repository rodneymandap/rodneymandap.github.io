import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import LevelUpProgressPage from "../pages/levelup/progress";

const mockGetProgress = jest.fn();
const mockGetActivity = jest.fn();
const mockRefresh = jest.fn();
const dashboard = { profile: { user_id: "user-1" } };

jest.mock("../components/levelup/LevelUpShell", () => ({ LevelUpShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("../components/levelup/LevelUpProvider", () => ({ useLevelUp: () => ({ dashboard, loading: false, error: "", refresh: mockRefresh }) }));
jest.mock("../lib/levelup/supabase", () => ({
  getLevelUpProgress: (...args: unknown[]) => mockGetProgress(...args),
  getLevelUpActivity: (...args: unknown[]) => mockGetActivity(...args),
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
  });

  it("renders derived 30-day analytics and paginates activity", async () => {
    render(<LevelUpProgressPage />);
    expect(await screen.findByText("110")).toBeInTheDocument();
    expect(screen.getByText("Morning training")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load next 20" }));
    await waitFor(() => expect(screen.getByText("First Step")).toBeInTheDocument());
    expect(mockGetActivity).toHaveBeenLastCalledWith({ at: "2026-08-31T10:00:00Z", id: "completion:1" });
  });
});
