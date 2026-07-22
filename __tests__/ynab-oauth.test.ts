import type { NextApiRequest, NextApiResponse } from "next";
import connectHandler from "../pages/api/ynab/oauth/connect";
import callbackHandler from "../pages/api/ynab/oauth/callback";
import { __resetYnabOAuthMemoryStore } from "../lib/ynab-oauth";

const originalEnv = process.env;

function createMockResponse() {
  const res: Partial<NextApiResponse> & {
    status: jest.Mock;
    json: jest.Mock;
    redirect: jest.Mock;
    send: jest.Mock;
    setHeader: jest.Mock;
  } = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res as NextApiResponse & typeof res;
}

function createMockRequest(
  method: string,
  query: Record<string, string> = {}
): NextApiRequest {
  return {
    method,
    headers: {
      host: "mcp.example.com",
      "x-forwarded-proto": "https",
    },
    query,
    body: {},
  } as NextApiRequest;
}

describe("YNAB OAuth endpoints", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    __resetYnabOAuthMemoryStore();
    process.env = { ...originalEnv };
    process.env.YNAB_CLIENT_ID = "client-id";
    process.env.YNAB_CLIENT_SECRET = "client-secret";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("redirects users to YNAB with read-only authorization code OAuth", async () => {
    const req = createMockRequest("GET");
    const res = createMockResponse();

    await connectHandler(req, res);

    expect(res.redirect).toHaveBeenCalledWith(302, expect.stringContaining("https://app.ynab.com/oauth/authorize"));
    const url = new URL(res.redirect.mock.calls[0][1]);
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("read-only");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://mcp.example.com/api/ynab/oauth/callback"
    );
  });

  it("exchanges the callback code and returns an MCP session token", async () => {
    const connectReq = createMockRequest("GET");
    const connectRes = createMockResponse();

    await connectHandler(connectReq, connectRes);
    const authorizationUrl = new URL(connectRes.redirect.mock.calls[0][1]);
    const state = authorizationUrl.searchParams.get("state") || "";

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "ynab-access-token",
        token_type: "bearer",
        expires_in: 7200,
        refresh_token: "ynab-refresh-token",
        scope: "read-only",
      }),
    });
    const callbackReq = createMockRequest("GET", { code: "auth-code", state });
    const callbackRes = createMockResponse();

    await callbackHandler(callbackReq, callbackRes);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://app.ynab.com/oauth/token",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("grant_type=authorization_code"),
      })
    );
    expect(callbackRes.status).toHaveBeenCalledWith(200);
    expect(callbackRes.send.mock.calls[0][0]).toContain("ynab_");
  });

  it("rejects callbacks with missing or expired state", async () => {
    const req = createMockRequest("GET", { code: "auth-code", state: "bad-state" });
    const res = createMockResponse();

    await callbackHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send.mock.calls[0][0]).toContain("invalid or expired");
  });

  it("rejects unsupported methods", async () => {
    const connectReq = createMockRequest("POST");
    const connectRes = createMockResponse();
    await connectHandler(connectReq, connectRes);

    expect(connectRes.status).toHaveBeenCalledWith(405);

    const callbackReq = createMockRequest("POST");
    const callbackRes = createMockResponse();
    await callbackHandler(callbackReq, callbackRes);

    expect(callbackRes.status).toHaveBeenCalledWith(405);
  });
});
