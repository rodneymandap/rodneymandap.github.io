import {
  aiQuestListSchema,
  levelUpAiRequestSchema,
  normalizeQuestSuggestion,
  suggestionToMissionInput,
} from "../lib/levelup/ai/schemas";

const suggestion = {
  title: "Speak Up",
  description: "Practice concise communication in the next meeting.",
  objectives: ["Prepare one point", "Speak once", "Write a reflection"],
  cadence: "once" as const,
  difficulty: "normal" as const,
  xpReward: 5000,
  statKey: "discipline" as const,
  reasoningSummary: "A bounded mission makes practice achievable.",
};

describe("LevelUp AI schemas", () => {
  it("normalizes arbitrary AI XP to the canonical difficulty reward", () => {
    expect(normalizeQuestSuggestion(suggestion).xpReward).toBe(25);
  });

  it("rejects too many daily suggestions and oversized objectives", () => {
    expect(
      aiQuestListSchema.safeParse({ suggestions: Array(4).fill(suggestion) }).success
    ).toBe(false);
    expect(
      aiQuestListSchema.safeParse({
        suggestions: [
          { ...suggestion, objectives: ["x".repeat(141)] },
        ],
      }).success
    ).toBe(false);
  });

  it("trims and validates discriminated request inputs", () => {
    const result = levelUpAiRequestSchema.parse({
      action: "quest",
      prompt: "  improve meeting communication  ",
    });
    expect(result.prompt).toBe("improve meeting communication");
    expect(
      levelUpAiRequestSchema.safeParse({ action: "coach", message: "x".repeat(601) })
        .success
    ).toBe(false);
  });

  it("folds objectives into an editable mission briefing", () => {
    const input = suggestionToMissionInput(suggestion);
    expect(input.description).toContain("Objectives:");
    expect(input.description).toContain("• Speak once");
    expect(input).not.toHaveProperty("xp_reward");
  });
});

