import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { DailyBriefing } from "../components/levelup/DailyBriefing";
import { LevelUpHero } from "../components/levelup/LevelUpHero";
import { LevelUpFeedback } from "../components/levelup/LevelUpFeedback";
import {
  getLevelUpHeroRank,
  getLevelUpHeroAppearance,
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
    expect(getLevelUpHeroRank(301)).toBe("vanguard");
    expect(getLevelUpHeroRank(901)).toBe("ascendant");
    const { rerender } = render(<LevelUpHero level={1} state="idle" />);
    expect(screen.getByText("Rookie")).toBeInTheDocument();
    rerender(<LevelUpHero level={901} state="celebrate" />);
    expect(screen.getByText("Ascendant")).toBeInTheDocument();
    expect(screen.getByText(/Daily Clear/)).toBeInTheDocument();
  });

  it("resolves every level into a capped visual form with unique progression effects", () => {
    expect(getLevelUpHeroAppearance(0)).toMatchObject({ baseLevel: 0, imageSrc: "/levelup/aegis-level-00.png", title: "Rookie", particleCount: 1 });
    expect(getLevelUpHeroAppearance(50)).toMatchObject({ baseLevel: 0, raw: true });
    expect(getLevelUpHeroAppearance(51)).toMatchObject({ baseLevel: 51, imageSrc: "/levelup/aegis-level-01.png", title: "Apprentice", raw: true });
    expect(getLevelUpHeroAppearance(100)).toMatchObject({ baseLevel: 51, raw: true });
    expect([101, 201, 301, 401, 501, 601, 701, 801, 901].map((level) => getLevelUpHeroAppearance(level).imageSrc)).toEqual([
      "/levelup/aegis-level-10.png",
      "/levelup/aegis-level-20.png",
      "/levelup/aegis-level-30.png",
      "/levelup/aegis-level-40.png",
      "/levelup/aegis-level-50.png",
      "/levelup/aegis-level-60.png",
      "/levelup/aegis-level-70.png",
      "/levelup/aegis-level-80.png",
      "/levelup/aegis-level-100.png",
    ]);
    expect(getLevelUpHeroAppearance(555)).toMatchObject({ baseLevel: 501, title: "Champion", motion: "hover" });
    expect(getLevelUpHeroAppearance(901)).toMatchObject({ baseLevel: 901, title: "Ascendant", motion: "ascend" });
    expect(getLevelUpHeroAppearance(1800)).toMatchObject({ baseLevel: 901, evolution: 100 });
  });

  it("renders the resolved artwork and evolution hooks", () => {
    const { rerender } = render(<LevelUpHero level={1} state="idle" />);
    expect(screen.getByTestId("levelup-hero-art").querySelector("img")).toHaveAttribute("src", expect.stringContaining("aegis-level-00.png"));
    expect(document.querySelector(".levelup-hero")).toHaveAttribute("data-evolution", "2");

    rerender(<LevelUpHero level={901} state="idle" />);
    expect(screen.getByTestId("levelup-hero-art").querySelector("img")).toHaveAttribute("src", expect.stringContaining("aegis-level-100.png"));
    expect(document.querySelector(".levelup-hero")).toHaveClass("levelup-hero-motion-ascend");
    expect(screen.getByText("Ascendant")).toBeInTheDocument();
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
