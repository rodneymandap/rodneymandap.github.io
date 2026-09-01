import type { NextApiRequest, NextApiResponse } from "next";

import handler, {
  setLevelUpAiProviderForTests,
} from "../pages/api/levelup/ai";
import { resetLevelUpAiRateLimitForTests } from "../lib/levelup/ai/rate-limit";
import {
  LevelUpAiProviderError,
  type LevelUpAiProvider,
} from "../lib/levelup/ai/provider";

jest.mock("../lib/levelup/ai/gemini", () => ({
  GeminiLevelUpAiProvider: jest.fn(),
}));

const mockGetClaims = jest.fn();
const mockRpc = jest.fn();

jest.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getClaims: (...args: unknown[]) => mockGetClaims(...args) },
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
  serializeCookieHeader: jest.fn(() => "session=updated"),
}));

const aiSuggestion = {
  title: "Speak Up",
  description: "Practice concise meeting communication.",
  objectives: ["Prepare one point", "Speak once"],
  cadence: "once" as const,
  difficulty: "normal" as const,
  xpReward: 5000,
  statKey: "discipline" as const,
  reasoningSummary: "This is deliberately bounded.",
};

const provider: LevelUpAiProvider = {
  generateQuestSuggestions: jest.fn().mockResolvedValue({ suggestions: [aiSuggestion] }),
  generateDailyMissions: jest.fn().mockResolvedValue({ suggestions: [aiSuggestion] }),
  generateWeeklyReview: jest.fn().mockResolvedValue({
    strongestArea: "Discipline",
    needsAttention: "Vitality",
    completionPattern: "Short quests were completed consistently.",
    recommendation: "Choose two short recovery quests next week.",
    nextFocus: "Recovery",
  }),
  answerCoach: jest.fn().mockResolvedValue({
    answer: "Complete one short communication quest today.",
    suggestions: [],
  }),
};

function request(body: unknown, headers: Record<string, string> = {}): NextApiRequest {
  return {
    method: "POST",
    body,
    headers,
    cookies: { session: "test" },
    query: {},
  } as unknown as NextApiRequest;
}

function response() {
  const res: Partial<NextApiResponse> & {
    status: jest.Mock;
    json: jest.Mock;
    setHeader: jest.Mock;
  } = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res as NextApiResponse & typeof res;
}

describe("/api/levelup/ai", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLevelUpAiRateLimitForTests();
    setLevelUpAiProviderForTests(provider);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
    mockRpc.mockImplementation((name: string) => {
      if (name === "get_levelup_dashboard") {
        return Promise.resolve({
          data: {
            profile: { user_id: "user-1", timezone: "Asia/Manila" },
            local_date: "2026-09-01",
            progress: { level: 2, total_xp: 125, current_streak: 3 },
            stats: [{ key: "discipline", xp: 75 }],
            missions: [],
            daily_focus: [],
          },
          error: null,
        });
      }
      if (name === "get_levelup_activity") {
        return Promise.resolve({ data: { items: [], next_cursor: null }, error: null });
      }
      return Promise.resolve({
        data: { period_completions: 4, period_xp: 100 },
        error: null,
      });
    });
  });

  afterAll(() => setLevelUpAiProviderForTests(null));

  it("protects unauthenticated requests before invoking the provider", async () => {
    mockGetClaims.mockResolvedValueOnce({ data: null, error: new Error("no session") });
    const res = response();
    await handler(request({ action: "weekly" }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(provider.generateWeeklyReview).not.toHaveBeenCalled();
  });

  it("rejects invalid and cross-origin requests", async () => {
    const invalidRes = response();
    await handler(request({ action: "quest", prompt: "" }), invalidRes);
    expect(invalidRes.status).toHaveBeenCalledWith(400);

    const originRes = response();
    await handler(
      request(
        { action: "weekly" },
        { origin: "https://attacker.example", host: "levelup.example" }
      ),
      originRes
    );
    expect(originRes.status).toHaveBeenCalledWith(403);
  });

  it("normalizes provider XP and returns structured quest output", async () => {
    const res = response();
    await handler(
      request({ action: "quest", prompt: "Improve meeting communication" }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "quest",
        suggestions: [expect.objectContaining({ xpReward: 25 })],
      })
    );
  });

  it("returns authoritative weekly totals from LevelUp context", async () => {
    const res = response();
    await handler(request({ action: "weekly" }), res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "weekly",
        report: expect.objectContaining({
          questsCompleted: 4,
          xpEarned: 100,
          currentStreak: 3,
        }),
      })
    );
  });

  it("fails safely when the provider returns malformed structured output", async () => {
    (provider.generateDailyMissions as jest.Mock).mockResolvedValueOnce({
      suggestions: [{ ...aiSuggestion, objectives: [] }],
    });
    const res = response();
    await handler(request({ action: "daily" }), res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      code: "provider_unavailable",
      message: expect.stringContaining("progress and quests are unaffected"),
    });
  });

  it.each(["not_configured", "timeout", "quota_exceeded", "safety_rejection"] as const)(
    "maps %s provider failures to a stable fallback",
    async (code) => {
      (provider.generateWeeklyReview as jest.Mock).mockRejectedValueOnce(
        new LevelUpAiProviderError(code, "internal provider detail")
      );
      const res = response();
      await handler(request({ action: "weekly" }), res);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        code,
        message: expect.stringContaining("progress and quests are unaffected"),
      });
    }
  );

  it("applies the per-user request cooldown", async () => {
    for (let index = 0; index < 10; index += 1) {
      await handler(request({ action: "weekly" }), response());
    }
    const res = response();
    await handler(request({ action: "weekly" }), res);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });
});
