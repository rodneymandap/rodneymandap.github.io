import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import LevelUpQuestsPage from "../pages/levelup/quests";

const mockRefresh = jest.fn();
const mockGetMissions = jest.fn();
const mockCreateMission = jest.fn();
const mockUpdateMission = jest.fn();
const mockArchiveMission = jest.fn();

const mission = {
  id: "mission-1", user_id: "user-1", title: "Read deeply", description: "Read 20 focused pages.", cadence: "daily", difficulty: "normal", stat_key: "intellect", xp_reward: 25, active: true, archived_at: null, created_at: "2026-08-31T00:00:00Z",
};

const dashboard = {
  profile: { user_id: "user-1" },
  missions: [],
};

jest.mock("../components/levelup/LevelUpShell", () => ({ LevelUpShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("../components/levelup/LevelUpProvider", () => ({
  useLevelUp: () => ({ dashboard, loading: false, error: "", refresh: mockRefresh }),
}));
jest.mock("../lib/levelup/supabase", () => ({
  getLevelUpMissions: (...args: unknown[]) => mockGetMissions(...args),
  createLevelUpMission: (...args: unknown[]) => mockCreateMission(...args),
  updateLevelUpMission: (...args: unknown[]) => mockUpdateMission(...args),
  setLevelUpMissionArchived: (...args: unknown[]) => mockArchiveMission(...args),
}));

describe("Level Up quest log", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMissions.mockResolvedValue([mission]);
    mockCreateMission.mockResolvedValue(undefined);
    mockUpdateMission.mockResolvedValue(undefined);
    mockArchiveMission.mockResolvedValue(undefined);
    mockRefresh.mockResolvedValue(undefined);
  });

  it("loads, edits, and archives missions without deleting history", async () => {
    render(<LevelUpQuestsPage />);
    expect(await screen.findByText("Read deeply")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit Read deeply" }));
    fireEvent.change(screen.getByLabelText("Mission title"), { target: { value: "Read and reflect" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(mockUpdateMission).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Archive Read deeply" }));
    await waitFor(() => expect(mockArchiveMission).toHaveBeenCalledWith("mission-1", true));
  });

  it("creates a mission with fixed difficulty and stat inputs", async () => {
    render(<LevelUpQuestsPage />);
    await screen.findByText("Read deeply");
    fireEvent.click(screen.getByRole("button", { name: "Create mission" }));
    fireEvent.change(screen.getByLabelText("Mission title"), { target: { value: "Evening walk" } });
    fireEvent.change(screen.getByLabelText("Cadence"), { target: { value: "weekly" } });
    fireEvent.change(screen.getByLabelText("Difficulty"), { target: { value: "easy" } });
    fireEvent.change(screen.getByLabelText("Stat"), { target: { value: "vitality" } });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Create mission",
      })
    );
    await waitFor(() => expect(mockCreateMission).toHaveBeenCalledWith("user-1", expect.objectContaining({ title: "Evening walk", cadence: "weekly", difficulty: "easy", stat_key: "vitality" })));
  });
});
