export type YnabClientOptions = {
  accessToken?: string;
  apiBase?: string;
};

export type YnabQuery = Record<string, string | number | boolean | undefined>;

const DEFAULT_YNAB_API_BASE = "https://api.ynab.com/v1";

export class YnabConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YnabConfigurationError";
  }
}

export class YnabApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details: unknown) {
    super(message);
    this.name = "YnabApiError";
    this.status = status;
    this.details = details;
  }
}

function getAccessToken(explicitToken?: string): string {
  const token = explicitToken || process.env.YNAB_ACCESS_TOKEN;

  if (!token) {
    throw new YnabConfigurationError(
      "No YNAB access token is available. Connect a YNAB account with OAuth or configure YNAB_ACCESS_TOKEN for owner-only use."
    );
  }

  return token;
}

function buildUrl(apiBase: string, path: string, query?: YnabQuery): string {
  const url = new URL(`${apiBase.replace(/\/$/, "")}${path}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

export async function ynabGet<T>(
  path: string,
  query?: YnabQuery,
  options: YnabClientOptions = {}
): Promise<T> {
  const token = getAccessToken(options.accessToken);
  const apiBase = options.apiBase || process.env.YNAB_API_BASE || DEFAULT_YNAB_API_BASE;
  const response = await fetch(buildUrl(apiBase, path, query), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload?.error?.detail === "string"
        ? payload.error.detail
        : `YNAB API request failed with status ${response.status}`;
    throw new YnabApiError(response.status, message, payload);
  }

  return payload as T;
}

export function clampLimit(value: unknown, defaultLimit = 25, maxLimit = 100): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultLimit;
  }

  return Math.min(Math.floor(parsed), maxLimit);
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7) + "-01";
}
