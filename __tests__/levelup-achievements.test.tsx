import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import LevelUpAchievementsPage from "../pages/levelup/achievements";

const mockGetAchievements = jest.fn();
const mockRefresh = jest.fn();
const dashboard = { profile: { user_id: "user-1" } };

jest.mock("../components/levelup/LevelUpShell", () => ({ LevelUpShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("../components/levelup/LevelUpProvider", () => ({ useLevelUp: () => ({ dashboard, loading: false, error: "", refresh: mockRefresh }) }));
jest.mock("../lib/levelup/supabase", () => ({ getLevelUpAchievements: (...args: unknown[]) => mockGetAchievements(...args) }));

describe("Level Up achievements", () => {
  it("shows locked and unlocked milestones", async () => {
    mockGetAchievements.mockResolvedValue([
      { slug: "first-step", title: "First Step", description: "Complete your first mission.", icon_key: "spark", criteria_type: "completion_count", threshold: 1, stat_key: null, unlocked: true, unlocked_at: "2026-08-31T10:00:00Z" },
      { slug: "streak-7", title: "Unbroken", description: "Build a 7-day mission streak.", icon_key: "flame", criteria_type: "streak", threshold: 7, stat_key: null, unlocked: false, unlocked_at: null },
    ]);
    render(<LevelUpAchievementsPage />);
    expect(await screen.findByText("First Step")).toBeInTheDocument();
    expect(screen.getByText("Unbroken")).toBeInTheDocument();
    expect(screen.getByText("/ 2 unlocked")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });
});
