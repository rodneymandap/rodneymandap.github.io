import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  LevelUpProvider,
  useLevelUp,
} from "../components/levelup/LevelUpProvider";

const mockGetDashboard = jest.fn();
const mockComplete = jest.fn();
const mockUndo = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/router", () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock("../lib/levelup/supabase", () => ({
  getLevelUpDashboard: (...args: unknown[]) => mockGetDashboard(...args),
  completeLevelUpMission: (...args: unknown[]) => mockComplete(...args),
  undoLevelUpMission: (...args: unknown[]) => mockUndo(...args),
}));

const baseDashboard = {
  profile: { user_id: "user-1", timezone: "Asia/Manila" },
  local_date: "2026-08-31",
  progress: { total_xp: 0, level: 1, xp_into_level: 0, xp_for_next_level: 100, current_streak: 0, best_streak: 0, last_active_date: null },
  stats: [], missions: [],
};

function ProviderProbe() {
  const context = useLevelUp();
  if (context.loading) return <p>Loading provider</p>;
  return (
    <div>
      <p>{context.dashboard ? `Level ${context.dashboard.progress.level}` : context.error}</p>
      {context.notice && <p>{context.notice.title}</p>}
      <button onClick={() => void context.completeMission("mission-1")}>Complete probe</button>
      <button onClick={() => void context.undoMission("mission-1")}>Undo probe</button>
      <button onClick={context.clearNotice}>Clear notice</button>
    </div>
  );
}

describe("LevelUpProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDashboard.mockResolvedValue(baseDashboard);
    mockComplete.mockResolvedValue({ ...baseDashboard, progress: { ...baseDashboard.progress, level: 2, total_xp: 100 }, event: { type: "mission_completed", mission_id: "mission-1", completion_id: "completion-1", xp_awarded: 100, stat_key: "discipline", new_achievements: [{ slug: "first-step", title: "First Step", description: "Complete one.", icon_key: "spark" }] } });
    mockUndo.mockResolvedValue({ ...baseDashboard, event: { type: "mission_undone", mission_id: "mission-1", completion_id: "completion-1" } });
  });

  it("loads confirmed state, completes, and undoes without optimistic changes", async () => {
    render(<LevelUpProvider><ProviderProbe /></LevelUpProvider>);
    expect(await screen.findByText("Level 1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Complete probe" }));
    expect(await screen.findByText("Level 2 reached")).toBeInTheDocument();
    expect(mockComplete).toHaveBeenCalledWith("mission-1");
    fireEvent.click(screen.getByRole("button", { name: "Undo probe" }));
    expect(await screen.findByText("Completion reversed")).toBeInTheDocument();
    expect(mockUndo).toHaveBeenCalledWith("mission-1");
  });

  it("keeps the last confirmed state when a mutation fails", async () => {
    mockComplete.mockRejectedValue(new Error("Database unavailable"));
    render(<LevelUpProvider><ProviderProbe /></LevelUpProvider>);
    await screen.findByText("Level 1");
    fireEvent.click(screen.getByRole("button", { name: "Complete probe" }));
    expect(await screen.findByText("Mission unchanged")).toBeInTheDocument();
    expect(screen.getByText("Level 1")).toBeInTheDocument();
  });

  it("surfaces load errors", async () => {
    mockGetDashboard.mockRejectedValue(new Error("Profile unavailable"));
    render(<LevelUpProvider><ProviderProbe /></LevelUpProvider>);
    expect(await screen.findByText("Profile unavailable")).toBeInTheDocument();
    await waitFor(() => expect(mockReplace).not.toHaveBeenCalled());
  });
});
