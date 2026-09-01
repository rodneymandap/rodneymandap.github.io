const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 10;
const attempts = new Map<string, number[]>();

export function consumeLevelUpAiRequest(
  userId: string,
  now = Date.now()
): { allowed: boolean; retryAfterSeconds: number } {
  const recent = (attempts.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS
  );
  if (recent.length >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((WINDOW_MS - (now - recent[0])) / 1000)
    );
    attempts.set(userId, recent);
    return { allowed: false, retryAfterSeconds };
  }
  recent.push(now);
  attempts.set(userId, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetLevelUpAiRateLimitForTests(): void {
  attempts.clear();
}

