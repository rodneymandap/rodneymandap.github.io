import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import LevelUpDashboardPage from "../pages/levelup";

const mockComplete = jest.fn();
const mockUndo = jest.fn();
const mockRefresh = jest.fn();
const mockSaveDailyFocus = jest.fn().mockResolvedValue(true);
const mockRequestLevelUpAi = jest.fn();

const dashboard = {
  profile: { user_id: "user-1", timezone: "Asia/Manila" },
  local_date: "2026-08-31",
  progress: {
    total_xp: 135,
    level: 2,
    xp_into_level: 35,
    xp_for_next_level: 200,
    current_streak: 3,
    best_streak: 7,
    last_active_date: "2026-08-31",
  },
  stats: [
    { key: "strength", xp: 50 },
    { key: "vitality", xp: 25 },
    { key: "intellect", xp: 25 },
    { key: "discipline", xp: 35 },
  ],
  missions: [
    { id: "m1", title: "Morning training", description: "Move with intent.", cadence: "daily", difficulty: "normal", stat_key: "strength", xp_reward: 25, active: true, archived_at: null, created_at: "2026-08-30T00:00:00Z", completed: false },
    { id: "m2", title: "Weekly review", description: "", cadence: "weekly", difficulty: "easy", stat_key: "discipline", xp_reward: 10, active: true, archived_at: null, created_at: "2026-08-30T00:00:00Z", completed: true },
  ],
  daily_focus: [],
};

jest.mock("../components/levelup/LevelUpShell", () => ({
  LevelUpShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("../components/levelup/LevelUpProvider", () => ({
  useLevelUp: () => ({
    dashboard,
    loading: false,
    error: "",
    refresh: mockRefresh,
    busyMissionId: null,
    focusSaving: false,
    saveDailyFocus: mockSaveDailyFocus,
    completeMission: mockComplete,
    undoMission: mockUndo,
  }),
}));
jest.mock("../lib/levelup/ai/client", () => ({
  requestLevelUpAi: (...args: unknown[]) => mockRequestLevelUpAi(...args),
}));
jest.mock("../lib/levelup/supabase", () => ({
  createLevelUpMission: jest.fn(),
}));

describe("Level Up dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestLevelUpAi.mockResolvedValue({
      action: "daily",
      suggestions: [
        {
          title: "Prepare One Point",
          description: "Prepare a concise contribution for the next meeting.",
          objectives: ["Write one sentence", "Say it during the meeting"],
          cadence: "daily",
          difficulty: "easy",
          xpReward: 10,
          statKey: "discipline",
          reasoningSummary: "A small action builds consistency.",
        },
      ],
    });
  });

  it("renders progression, stats, and cadence groups", () => {
    render(<LevelUpDashboardPage />);
    expect(screen.getByText("135 total XP")).toBeInTheDocument();
    expect(screen.getByText("Today’s missions")).toBeInTheDocument();
    expect(screen.getByText("Weekly operations")).toBeInTheDocument();
    expect(screen.getByText("Strength XP")).toBeInTheDocument();
    expect(screen.getAllByText("Morning training").length).toBeGreaterThan(0);
  });

  it("waits for confirmed completion and supports undo", () => {
    render(<LevelUpDashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: "Complete Morning training" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo Weekly review" }));
    expect(mockComplete).toHaveBeenCalledWith("m1");
    expect(mockUndo).toHaveBeenCalledWith("m2");
  });

  it("opens the first-visit briefing and keeps a return banner when postponed", () => {
    render(<LevelUpDashboardPage />);
    expect(screen.getByRole("dialog", { name: "Choose your top three" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.getByText("Your daily route is still open.")).toBeInTheDocument();
  });

  it("generates daily missions only after an explicit action", async () => {
    render(<LevelUpDashboardPage />);
    expect(mockRequestLevelUpAi).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Generate Daily Missions" })
    );
    expect(await screen.findByText("Prepare One Point")).toBeInTheDocument();
    expect(mockRequestLevelUpAi).toHaveBeenCalledWith({ action: "daily" });
    fireEvent.click(screen.getByRole("button", { name: "Review quest" }));
    await waitFor(() => {
      const dialog = screen.getByRole("dialog", { name: "Confirm mission" });
      expect(dialog).toBeInTheDocument();
      expect(dialog.parentElement).toBe(document.body);
    });
  });

  it("keeps Ask System focused on a single ephemeral coaching response", async () => {
    mockRequestLevelUpAi.mockResolvedValueOnce({
      action: "coach",
      answer: "Choose one short communication mission and complete it before noon.",
      suggestions: [],
    });
    render(<LevelUpDashboardPage />);
    fireEvent.change(screen.getByLabelText("Ask System"), {
      target: { value: "What should I do today?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask System" }));
    expect(
      await screen.findByText(/Choose one short communication mission/)
    ).toBeInTheDocument();
    expect(mockRequestLevelUpAi).toHaveBeenCalledWith({
      action: "coach",
      message: "What should I do today?",
    });
  });
});
