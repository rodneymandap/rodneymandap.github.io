import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { LEVELUP_GEMINI_MODELS } from "../../../lib/levelup/ai/models";
import {
  loadLevelUpGeminiModel,
  saveLevelUpGeminiModel,
} from "../../../lib/levelup/settings";

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
        Object.entries(req.cookies).map(([name, value]) => ({ name, value: value ?? "" })),
      setAll: (cookiesToSet, headers) => {
        const serialized = cookiesToSet.map(({ name, value, options }) =>
          serializeCookieHeader(name, value, options)
        );
        if (serialized.length) res.setHeader("Set-Cookie", serialized);
        Object.entries(headers).forEach(([name, value]) => res.setHeader(name, value));
      },
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Record<string, unknown>>
) {
  res.setHeader("Cache-Control", "private, no-store");

  const supabase = createLevelUpServerClient(req, res);
  if (!supabase) {
    return res.status(503).json({ code: "levelup_not_configured" });
  }

  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) {
    return res.status(401).json({ code: "authentication_required" });
  }

  if (req.method === "GET") {
    const model = await loadLevelUpGeminiModel(supabase);
    return res.status(200).json({
      model,
      models: LEVELUP_GEMINI_MODELS,
    });
  }

  if (req.method === "POST") {
    const model = typeof req.body?.model === "string" ? req.body.model.trim() : "";
    if (
      model &&
      !LEVELUP_GEMINI_MODELS.includes(model as (typeof LEVELUP_GEMINI_MODELS)[number])
    ) {
      return res.status(400).json({ code: "invalid_model" });
    }
    await saveLevelUpGeminiModel(supabase, model || null);
    return res.status(200).json({ model: model || null, models: LEVELUP_GEMINI_MODELS });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ code: "method_not_allowed" });
}
