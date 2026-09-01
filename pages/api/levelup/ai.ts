import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

import logger from "../../../lib/logger";
import { GeminiLevelUpAiProvider } from "../../../lib/levelup/ai/gemini";
import {
  LevelUpAiProviderError,
  type LevelUpAiContext,
  type LevelUpAiProvider,
} from "../../../lib/levelup/ai/provider";
import { consumeLevelUpAiRequest } from "../../../lib/levelup/ai/rate-limit";
import {
  aiCoachResponseSchema,
  aiQuestListSchema,
  aiWeeklyReviewSchema,
  levelUpAiRequestSchema,
  normalizeQuestSuggestions,
  type LevelUpAiResponse,
} from "../../../lib/levelup/ai/schemas";
import type {
  LevelUpActivityPage,
  LevelUpDashboard,
  LevelUpProgressReport,
} from "../../../lib/levelup/types";

const FALLBACK_MESSAGE =
  "AI assistance is temporarily unavailable. Your LevelUp progress and quests are unaffected.";

let providerOverride: LevelUpAiProvider | null = null;

export function setLevelUpAiProviderForTests(
  provider: LevelUpAiProvider | null
): void {
  providerOverride = provider;
}

function getProvider(): LevelUpAiProvider {
  return providerOverride ?? new GeminiLevelUpAiProvider();
}

function sendError(
  res: NextApiResponse,
  status: number,
  code: string,
  message = FALLBACK_MESSAGE
) {
  return res.status(status).json({ code, message });
}

function isSameOrigin(req: NextApiRequest): boolean {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function createLevelUpServerClient(
  req: NextApiRequest,
  res: NextApiResponse
): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  return createServerClient(url, key, {
    cookies: {
      getAll: () =>
        Object.entries(req.cookies).map(([name, value]) => ({
          name,
          value: value ?? "",
        })),
      setAll: (cookiesToSet, headers) => {
        const serialized = cookiesToSet.map(({ name, value, options }) =>
          serializeCookieHeader(name, value, options)
        );
        if (serialized.length) res.setHeader("Set-Cookie", serialized);
        Object.entries(headers).forEach(([name, value]) =>
          res.setHeader(name, value)
        );
      },
    },
  });
}

async function buildContext(
  supabase: SupabaseClient,
  dashboard: LevelUpDashboard
): Promise<LevelUpAiContext> {
  const [activityResult, progressResult] = await Promise.all([
    supabase.rpc("get_levelup_activity", {
      p_limit: 12,
      p_cursor_at: null,
      p_cursor_id: null,
    }),
    supabase.rpc("get_levelup_progress", { p_days: 7 }),
  ]);

  const activity = activityResult.data as LevelUpActivityPage | null;
  const progress = progressResult.data as LevelUpProgressReport | null;

  return {
    level: dashboard.progress.level,
    currentXp: dashboard.progress.total_xp,
    currentStreak: dashboard.progress.current_streak,
    stats: dashboard.stats.map((stat) => ({ key: stat.key, xp: stat.xp })),
    unfinishedMissions: dashboard.missions
      .filter((mission) => !mission.completed)
      .slice(0, 12)
      .map((mission) => ({
        title: mission.title,
        cadence: mission.cadence,
        difficulty: mission.difficulty,
        statKey: mission.stat_key,
      })),
    recentCompletions: (activity?.items ?? [])
      .filter((item) => item.type === "mission_completed")
      .slice(0, 12)
      .map((item) => ({
        title: item.title,
        xp: item.metadata.xp_awarded ?? 0,
        statKey: item.metadata.stat_key ?? "discipline",
        date: item.metadata.local_date,
      })),
    lastSevenDays: {
      completions: progress?.period_completions ?? 0,
      xp: progress?.period_xp ?? 0,
    },
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LevelUpAiResponse | Record<string, unknown>>
) {
  res.setHeader("Cache-Control", "private, no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(res, 405, "method_not_allowed", "Only POST is supported.");
  }
  if (!isSameOrigin(req)) {
    return sendError(res, 403, "origin_rejected", "This request origin is not allowed.");
  }

  const request = levelUpAiRequestSchema.safeParse(req.body);
  if (!request.success) {
    return sendError(res, 400, "invalid_request", "The AI request is invalid or too large.");
  }

  const supabase = createLevelUpServerClient(req, res);
  if (!supabase) {
    return sendError(res, 503, "levelup_not_configured");
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    return sendError(res, 401, "authentication_required", "Sign in to use the System assistant.");
  }

  const { data: dashboardData, error: dashboardError } = await supabase.rpc(
    "get_levelup_dashboard"
  );
  if (dashboardError || !dashboardData) {
    return sendError(res, 403, "levelup_not_authorized", "This account is not authorized for LevelUp.");
  }

  const rateLimit = consumeLevelUpAiRequest(userId);
  if (!rateLimit.allowed) {
    res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
    return sendError(
      res,
      429,
      "rate_limited",
      "The System needs a short cooldown before another request."
    );
  }

  try {
    const dashboard = dashboardData as LevelUpDashboard;
    const context = await buildContext(supabase, dashboard);
    const provider = getProvider();

    switch (request.data.action) {
      case "quest": {
        const result = await provider.generateQuestSuggestions(
          request.data.prompt,
          context
        );
        const validated = aiQuestListSchema.parse(result);
        return res.status(200).json({
          action: "quest",
          suggestions: normalizeQuestSuggestions(validated.suggestions),
        });
      }
      case "daily": {
        const result = await provider.generateDailyMissions(
          request.data.focusArea,
          context
        );
        const validated = aiQuestListSchema.parse(result);
        return res.status(200).json({
          action: "daily",
          suggestions: normalizeQuestSuggestions(validated.suggestions),
        });
      }
      case "weekly": {
        const report = aiWeeklyReviewSchema.parse(
          await provider.generateWeeklyReview(context)
        );
        return res.status(200).json({
          action: "weekly",
          report: {
            questsCompleted: context.lastSevenDays.completions,
            xpEarned: context.lastSevenDays.xp,
            currentStreak: context.currentStreak,
            ...report,
          },
        });
      }
      case "coach": {
        const result = aiCoachResponseSchema.parse(
          await provider.answerCoach(request.data.message, context)
        );
        return res.status(200).json({
          action: "coach",
          ...result,
          suggestions: normalizeQuestSuggestions(result.suggestions),
        });
      }
    }
  } catch (error) {
    const code =
      error instanceof LevelUpAiProviderError
        ? error.code
        : "provider_unavailable";
    logger.warn("LevelUp AI request failed", {
      code,
      action: request.data.action,
      ...(error instanceof LevelUpAiProviderError && error.providerStatus
        ? { providerStatus: error.providerStatus }
        : {}),
    });
    return sendError(res, 503, code);
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "4kb" },
  },
};
