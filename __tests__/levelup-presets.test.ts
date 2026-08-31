import { LEVELUP_QUEST_PRESETS } from "../lib/levelup/presets";
import { LEVELUP_DIFFICULTY_XP } from "../lib/levelup/types";

describe("Level Up personal-plan preset catalog", () => {
  it("defines the complete catalog with unique stable keys", () => {
    expect(LEVELUP_QUEST_PRESETS).toHaveLength(12);
    expect(new Set(LEVELUP_QUEST_PRESETS.map((preset) => preset.key)).size).toBe(12);
    expect(LEVELUP_QUEST_PRESETS.map((preset) => preset.input.cadence)).toEqual([
      "daily", "daily", "daily", "daily", "daily",
      "weekly", "weekly", "weekly", "weekly", "weekly",
      "once", "once",
    ]);
  });

  it("maps each preset difficulty to a supported XP reward", () => {
    for (const preset of LEVELUP_QUEST_PRESETS) {
      expect(LEVELUP_DIFFICULTY_XP[preset.input.difficulty]).toBeGreaterThan(0);
      expect(preset.input.title).toBeTruthy();
      expect(preset.input.description).toBeTruthy();
    }
  });
});
