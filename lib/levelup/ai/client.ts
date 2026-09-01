import type {
  LevelUpAiRequest,
  LevelUpAiResponse,
} from "./schemas";

const FALLBACK_MESSAGE =
  "AI assistance is temporarily unavailable. Your LevelUp progress and quests are unaffected.";

export async function requestLevelUpAi(
  request: LevelUpAiRequest
): Promise<LevelUpAiResponse> {
  const response = await fetch("/api/levelup/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const body = (await response.json().catch(() => null)) as
    | LevelUpAiResponse
    | { message?: string }
    | null;
  if (!response.ok) {
    throw new Error(body && "message" in body && body.message ? body.message : FALLBACK_MESSAGE);
  }
  if (!body || !("action" in body)) throw new Error(FALLBACK_MESSAGE);
  return body;
}

