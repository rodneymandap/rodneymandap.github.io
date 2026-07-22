import type { NextApiRequest, NextApiResponse } from "next";
import handler from "../pages/api/ynab-mcp";

const originalEnv = process.env;

function createMockResponse() {
  const res: Partial<NextApiResponse> & {
    status: jest.Mock;
    json: jest.Mock;
    end: jest.Mock;
    setHeader: jest.Mock;
  } = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res as NextApiResponse & typeof res;
}

function createMockRequest(
  method: string,
  body: unknown = {},
  headers: Record<string, string> = {}
): NextApiRequest {
  return {
    method,
    headers,
    query: {},
    body,
  } as NextApiRequest;
}

describe("/api/ynab-mcp", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
    delete process.env.MCP_API_KEY;
    process.env.YNAB_ACCESS_TOKEN = "ynab-test-token";
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns health details for GET requests", async () => {
    const req = createMockRequest("GET");
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        endpoint: "/api/ynab-mcp",
      })
    );
  });

  it("returns MCP initialization details", async () => {
    const req = createMockRequest("POST", {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonrpc: "2.0",
        id: 1,
        result: expect.objectContaining({
          capabilities: { tools: {} },
          serverInfo: expect.objectContaining({ name: "rodney-ynab-mcp" }),
        }),
      })
    );
  });

  it("lists the YNAB tools", async () => {
    const req = createMockRequest("POST", {
      jsonrpc: "2.0",
      id: "tools",
      method: "tools/list",
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].result.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "ynab_list_plans" }),
        expect.objectContaining({ name: "ynab_list_transactions" }),
      ])
    );
  });

  it("requires a valid owner token for tool calls when MCP_API_KEY is configured", async () => {
    process.env.MCP_API_KEY = "secret";
    delete process.env.YNAB_ACCESS_TOKEN;
    const req = createMockRequest("POST", {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "ynab_list_plans",
        arguments: {},
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].error.message).toContain("No YNAB access token");
  });

  it("calls YNAB when a tool is invoked", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { plans: [{ id: "plan-1", name: "Main" }] } }),
    });
    const req = createMockRequest("POST", {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "ynab_list_plans",
        arguments: {},
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.ynab.com/v1/plans",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer ynab-test-token",
        }),
      })
    );
    expect(res.json.mock.calls[0][0].result.content[0].text).toContain("Main");
  });

  it("filters closed accounts by default", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          accounts: [
            { id: "open", name: "Checking", closed: false },
            { id: "closed", name: "Old", closed: true },
          ],
        },
      }),
    });
    const req = createMockRequest("POST", {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "ynab_list_accounts",
        arguments: {},
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    const text = res.json.mock.calls[0][0].result.content[0].text;
    expect(text).toContain("Checking");
    expect(text).not.toContain("Old");
  });

  it("filters hidden categories by default", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          category_groups: [
            {
              name: "Visible",
              hidden: false,
              deleted: false,
              categories: [
                { name: "Groceries", hidden: false, deleted: false },
                { name: "Hidden Category", hidden: true, deleted: false },
              ],
            },
            { name: "Hidden Group", hidden: true, deleted: false, categories: [] },
          ],
        },
      }),
    });
    const req = createMockRequest("POST", {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "ynab_list_categories",
        arguments: {},
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    const text = res.json.mock.calls[0][0].result.content[0].text;
    expect(text).toContain("Groceries");
    expect(text).not.toContain("Hidden Category");
    expect(text).not.toContain("Hidden Group");
  });

  it("limits transactions and supports account-specific transaction URLs", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          transactions: [
            { id: "1" },
            { id: "2" },
            { id: "3" },
          ],
        },
      }),
    });
    const req = createMockRequest("POST", {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "ynab_list_transactions",
        arguments: {
          plan_id: "plan-1",
          account_id: "account-1",
          since_date: "2026-07-01",
          limit: 2,
        },
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.ynab.com/v1/plans/plan-1/accounts/account-1/transactions?since_date=2026-07-01",
      expect.any(Object)
    );
    const text = res.json.mock.calls[0][0].result.content[0].text;
    expect(text).toContain('"returned": 2');
    expect(text).toContain('"total_available": 3');
  });

  it("gets the current month summary when no month is passed", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { month: { month: "2026-07-01" } } }),
    });
    const req = createMockRequest("POST", {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "ynab_get_month",
        arguments: { plan_id: "plan-1" },
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
      "/plans/plan-1/months/"
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("builds a plan overview from multiple YNAB calls", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { accounts: [] } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { category_groups: [] } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { month: {} } }) });
    const req = createMockRequest("POST", {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "ynab_get_plan_overview",
        arguments: { month: "2026-07-01" },
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(res.json.mock.calls[0][0].result.content[0].text).toContain(
      "month_summary"
    );
  });

  it("accepts authorized bearer requests when MCP_API_KEY is configured", async () => {
    process.env.MCP_API_KEY = "secret";
    const req = createMockRequest(
      "POST",
      {
        jsonrpc: "2.0",
        id: 8,
        method: "tools/list",
      },
      { authorization: "Bearer secret" }
    );
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("handles notifications without a response body", async () => {
    const req = createMockRequest("POST", {
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it("returns JSON-RPC errors for unknown methods and tools", async () => {
    const unknownMethodReq = createMockRequest("POST", {
      jsonrpc: "2.0",
      id: 9,
      method: "missing/method",
    });
    const unknownMethodRes = createMockResponse();
    await handler(unknownMethodReq, unknownMethodRes);

    expect(unknownMethodRes.json.mock.calls[0][0].error.code).toBe(-32601);

    const unknownToolReq = createMockRequest("POST", {
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: { name: "missing_tool", arguments: {} },
    });
    const unknownToolRes = createMockResponse();
    await handler(unknownToolReq, unknownToolRes);

    expect(unknownToolRes.json.mock.calls[0][0].error.code).toBe(-32603);
  });

  it("handles YNAB configuration and API errors as tool errors", async () => {
    delete process.env.YNAB_ACCESS_TOKEN;
    const missingTokenReq = createMockRequest("POST", {
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: { name: "ynab_list_plans", arguments: {} },
    });
    const missingTokenRes = createMockResponse();
    await handler(missingTokenReq, missingTokenRes);

    expect(missingTokenRes.json.mock.calls[0][0].error.message).toContain(
      "No YNAB access token"
    );

    process.env.YNAB_ACCESS_TOKEN = "ynab-test-token";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: { detail: "Rate limited" } }),
    });
    const apiErrorReq = createMockRequest("POST", {
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: { name: "ynab_list_plans", arguments: {} },
    });
    const apiErrorRes = createMockResponse();
    await handler(apiErrorReq, apiErrorRes);

    expect(apiErrorRes.json.mock.calls[0][0].error.message).toBe("Rate limited");
  });

  it("handles batches, invalid JSON, and unsupported methods", async () => {
    const batchReq = createMockRequest("POST", [
      { jsonrpc: "2.0", id: "a", method: "tools/list" },
      { jsonrpc: "2.0", method: "notifications/initialized" },
    ]);
    const batchRes = createMockResponse();
    await handler(batchReq, batchRes);

    expect(batchRes.json.mock.calls[0][0]).toHaveLength(1);

    const invalidJsonReq = createMockRequest("POST", "{");
    const invalidJsonRes = createMockResponse();
    await handler(invalidJsonReq, invalidJsonRes);

    expect(invalidJsonRes.status).toHaveBeenCalledWith(400);

    const putReq = createMockRequest("PUT");
    const putRes = createMockResponse();
    await handler(putReq, putRes);

    expect(putRes.status).toHaveBeenCalledWith(405);
    expect(putRes.setHeader).toHaveBeenCalledWith("Allow", "GET, POST");
  });

  it("uses OAuth session bearer tokens for tool calls", async () => {
    delete process.env.YNAB_ACCESS_TOKEN;
    process.env.YNAB_CLIENT_ID = "client-id";
    process.env.YNAB_CLIENT_SECRET = "client-secret";
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "redis-token";
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: JSON.stringify({
            accessToken: "oauth-access-token",
            refreshToken: "oauth-refresh-token",
            expiresAt: Date.now() + 60 * 60 * 1000,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }),
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { plans: [{ id: "plan-1", name: "OAuth Plan" }] } }),
      });
    const req = createMockRequest(
      "POST",
      {
        jsonrpc: "2.0",
        id: 13,
        method: "tools/call",
        params: { name: "ynab_list_plans", arguments: {} },
      },
      { authorization: "Bearer ynab_session" }
    );
    const res = createMockResponse();

    await handler(req, res);

    expect(global.fetch).toHaveBeenLastCalledWith(
      "https://api.ynab.com/v1/plans",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer oauth-access-token",
        }),
      })
    );
    expect(res.json.mock.calls[0][0].result.content[0].text).toContain("OAuth Plan");
  });
});
