import type { NextApiRequest } from "next";
import crypto from "crypto";
import { YnabConfigurationError } from "./ynab";

type YnabOAuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope?: string;
};

type OAuthStateRecord = {
  codeVerifier: string;
  redirectUri: string;
  createdAt: number;
};

type YnabConnectionRecord = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope?: string;
  createdAt: number;
  updatedAt: number;
};

const YNAB_AUTHORIZE_URL = "https://app.ynab.com/oauth/authorize";
const YNAB_TOKEN_URL = "https://app.ynab.com/oauth/token";
const STATE_TTL_SECONDS = 10 * 60;
const CONNECTION_TTL_SECONDS = 90 * 24 * 60 * 60;
const REFRESH_GRACE_MS = 60 * 1000;

const memoryStore = new Map<string, unknown>();

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new YnabConfigurationError(`${name} is required for YNAB OAuth.`);
  }

  return value;
}

function base64Url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomToken(bytes = 32): string {
  return base64Url(crypto.randomBytes(bytes));
}

function sha256Base64Url(value: string): string {
  return base64Url(crypto.createHash("sha256").update(value).digest());
}

function getOrigin(req: NextApiRequest): string {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = typeof forwardedProto === "string" ? forwardedProto : "https";
  const host = req.headers.host;

  if (!host) {
    throw new YnabConfigurationError("Unable to determine OAuth redirect host.");
  }

  return `${proto}://${host}`;
}

export function getYnabRedirectUri(req: NextApiRequest): string {
  return process.env.YNAB_REDIRECT_URI || `${getOrigin(req)}/api/ynab/oauth/callback`;
}

async function redisCommand<T>(command: Array<string | number>): Promise<T | null> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl && !redisToken) {
    return null;
  }

  if (!redisUrl || !redisToken) {
    throw new YnabConfigurationError("Upstash Redis is partially configured.");
  }

  const endpoint = `${redisUrl}/${command
    .map((part) => encodeURIComponent(String(part)))
    .join("/")}`;
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${redisToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Token store returned ${response.status}`);
  }

  const payload = (await response.json()) as { result?: T; error?: string };

  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload.result ?? null;
}

async function storeJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const stored = await redisCommand<"OK">(["SET", key, JSON.stringify(value), "EX", ttlSeconds]);

  if (!stored) {
    memoryStore.set(key, value);
  }
}

async function readJson<T>(key: string): Promise<T | null> {
  const stored = await redisCommand<string>(["GET", key]);

  if (stored) {
    return JSON.parse(stored) as T;
  }

  return (memoryStore.get(key) as T | undefined) || null;
}

async function deleteJson(key: string): Promise<void> {
  await redisCommand<number>(["DEL", key]);
  memoryStore.delete(key);
}

function mapTokenResponse(token: YnabOAuthTokenResponse, existingCreatedAt?: number): YnabConnectionRecord {
  const now = Date.now();

  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: now + token.expires_in * 1000,
    scope: token.scope,
    createdAt: existingCreatedAt || now,
    updatedAt: now,
  };
}

async function requestYnabToken(body: Record<string, string>): Promise<YnabOAuthTokenResponse> {
  const response = await fetch(YNAB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(body).toString(),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      typeof payload?.error_description === "string"
        ? payload.error_description
        : "YNAB OAuth token request failed.";
    throw new Error(detail);
  }

  return payload as YnabOAuthTokenResponse;
}

export async function createYnabAuthorizationUrl(req: NextApiRequest): Promise<string> {
  const clientId = requireEnv("YNAB_CLIENT_ID");
  const redirectUri = getYnabRedirectUri(req);
  const state = randomToken();
  const codeVerifier = randomToken(48);
  const codeChallenge = sha256Base64Url(codeVerifier);

  await storeJson(
    `ynab:oauth:state:${state}`,
    {
      codeVerifier,
      redirectUri,
      createdAt: Date.now(),
    } satisfies OAuthStateRecord,
    STATE_TTL_SECONDS
  );

  const url = new URL(YNAB_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "read-only");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  return url.toString();
}

export async function completeYnabOAuth(code: string, state: string): Promise<string> {
  const clientId = requireEnv("YNAB_CLIENT_ID");
  const clientSecret = requireEnv("YNAB_CLIENT_SECRET");
  const stateKey = `ynab:oauth:state:${state}`;
  const stateRecord = await readJson<OAuthStateRecord>(stateKey);

  if (!stateRecord) {
    throw new Error("OAuth state is invalid or expired. Please start the YNAB connection again.");
  }

  await deleteJson(stateKey);

  const token = await requestYnabToken({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: stateRecord.redirectUri,
    grant_type: "authorization_code",
    code,
    code_verifier: stateRecord.codeVerifier,
  });
  const sessionId = `ynab_${randomToken(32)}`;

  await storeJson(
    `ynab:connection:${sessionId}`,
    mapTokenResponse(token),
    CONNECTION_TTL_SECONDS
  );

  return sessionId;
}

export async function getYnabAccessTokenForSession(sessionId: string): Promise<string> {
  const clientId = requireEnv("YNAB_CLIENT_ID");
  const clientSecret = requireEnv("YNAB_CLIENT_SECRET");
  const key = `ynab:connection:${sessionId}`;
  const connection = await readJson<YnabConnectionRecord>(key);

  if (!connection) {
    throw new YnabConfigurationError("YNAB OAuth session is invalid or expired.");
  }

  if (connection.expiresAt > Date.now() + REFRESH_GRACE_MS) {
    return connection.accessToken;
  }

  const refreshed = await requestYnabToken({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: connection.refreshToken,
  });
  const nextConnection = mapTokenResponse(refreshed, connection.createdAt);

  await storeJson(key, nextConnection, CONNECTION_TTL_SECONDS);

  return nextConnection.accessToken;
}

export function __resetYnabOAuthMemoryStore() {
  memoryStore.clear();
}
