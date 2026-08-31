import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { DailyBriefing } from "../components/levelup/DailyBriefing";
import { LevelUpHero } from "../components/levelup/LevelUpHero";
import { LevelUpFeedback } from "../components/levelup/LevelUpFeedback";
import {
  getLevelUpHeroRank,
  isLevelUpComebackDay,
  type LevelUpMission,
} from "../lib/levelup/types";

const missions: LevelUpMission[] = [
  { id: "m1", preset_key: null, title: "Train", description: "", cadence: "daily", difficulty: "easy", stat_key: "strength", xp_reward: 10, active: true, archived_at: null, created_at: "2026-09-01T00:00:00Z", completed: false },
  { id: "m2", preset_key: null, title: "Read", description: "", cadence: "daily", difficulty: "normal", stat_key: "intellect", xp_reward: 25, active: true, archived_at: null, created_at: "2026-09-01T00:00:00Z", completed: false },
  { id: "m3", preset_key: null, title: "Plan", description: "", cadence: "weekly", difficulty: "normal", stat_key: "discipline", xp_reward: 25, active: true, archived_at: null, created_at: "2026-09-01T00:00:00Z", completed: false },
  { id: "m4", preset_key: null, title: "Recover", description: "", cadence: "daily", difficulty: "easy", stat_key: "vitality", xp_reward: 10, active: true, archived_at: null, created_at: "2026-09-01T00:00:00Z", completed: false },
];

describe("Level Up consistency loop", () => {
  it("maps hero ranks at the defined milestones", () => {
    expect(getLevelUpHeroRank(1)).toBe("initiate");
    expect(getLevelUpHeroRank(5)).toBe("vanguard");
    expect(getLevelUpHeroRank(10)).toBe("ascendant");
    const { rerender } = render(<LevelUpHero level={1} state="idle" />);
    expect(screen.getByText("Initiate")).toBeInTheDocument();
    rerender(<LevelUpHero level={10} state="celebrate" />);
    expect(screen.getByText("Ascendant")).toBeInTheDocument();
    expect(screen.getByText(/Daily Clear/)).toBeInTheDocument();
  });

  it("derives comeback days without changing streak data", () => {
    expect(isLevelUpComebackDay("2026-08-30", "2026-09-01")).toBe(true);
    expect(isLevelUpComebackDay("2026-08-31", "2026-09-01")).toBe(false);
    expect(isLevelUpComebackDay(null, "2026-09-01")).toBe(false);
    expect(isLevelUpComebackDay("invalid", "2026-09-01")).toBe(false);
  });

  it("selects at most three quests, supports ordering, and saves atomically", async () => {
    const onSave = jest.fn().mockResolvedValue(true);
    const onClose = jest.fn();
    render(
      <DailyBriefing
        open
        missions={missions}
        initialMissionIds={[]}
        saving={false}
        onSave={onSave}
        onPostpone={jest.fn()}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Train/ }));
    fireEvent.click(screen.getByRole("button", { name: /Read/ }));
    fireEvent.click(screen.getByRole("button", { name: /Plan/ }));
    expect(screen.getByRole("button", { name: /Recover/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Move Read earlier" }));
    fireEvent.click(screen.getByRole("button", { name: "Start 3 quests" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(["m2", "m1", "m3"]));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders an accessible Daily Clear ceremony with XP and achievements", () => {
    const onDismiss = jest.fn();
    render(
      <LevelUpFeedback
        feedback={{
          tone: "success",
          title: "Daily Clear",
          message: "+25 XP awarded.",
          xp: 25,
          dailyClear: true,
          achievements: [{ slug: "momentum", title: "Momentum", description: "Keep going", icon_key: "flame" }],
        }}
        onDismiss={onDismiss}
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent("Daily Clear");
    expect(screen.getByLabelText("25 experience points earned")).toBeInTheDocument();
    expect(screen.getByText(/Achievement unlocked · Momentum/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
