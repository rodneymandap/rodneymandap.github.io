import type { NextApiRequest, NextApiResponse } from "next";
import { getYnabAccessTokenForSession } from "../../lib/ynab-oauth";
import { clampLimit, currentMonth, ynabGet } from "../../lib/ynab";

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method?: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

type McpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const SERVER_INFO = {
  name: "rodney-ynab-mcp",
  version: "0.1.0",
};

const DEFAULT_PLAN_ID = "last-used";

const tools: McpTool[] = [
  {
    name: "ynab_list_plans",
    description: "List available YNAB plans for the configured account.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "ynab_list_accounts",
    description: "List accounts in a YNAB plan, optionally including closed accounts.",
    inputSchema: {
      type: "object",
      properties: {
        plan_id: {
          type: "string",
          description: "YNAB plan id. Defaults to last-used.",
        },
        include_closed: {
          type: "boolean",
          description: "Include closed accounts in the response.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "ynab_list_categories",
    description: "List category groups and categories for a YNAB plan.",
    inputSchema: {
      type: "object",
      properties: {
        plan_id: {
          type: "string",
          description: "YNAB plan id. Defaults to last-used.",
        },
        include_hidden: {
          type: "boolean",
          description: "Include hidden category groups and categories.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "ynab_get_month",
    description: "Get the month summary for a YNAB plan.",
    inputSchema: {
      type: "object",
      properties: {
        plan_id: {
          type: "string",
          description: "YNAB plan id. Defaults to last-used.",
        },
        month: {
          type: "string",
          description: "Month in YYYY-MM-01 format. Defaults to the current month.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "ynab_list_transactions",
    description:
      "List YNAB transactions, with optional filters for account, category, payee, month, date range, and status.",
    inputSchema: {
      type: "object",
      properties: {
        plan_id: {
          type: "string",
          description: "YNAB plan id. Defaults to last-used.",
        },
        account_id: { type: "string" },
        category_id: { type: "string" },
        payee_id: { type: "string" },
        month: {
          type: "string",
          description: "Month in YYYY-MM-01 format.",
        },
        since_date: {
          type: "string",
          description: "Only transactions on or after this date, formatted YYYY-MM-DD.",
        },
        until_date: {
          type: "string",
          description: "Only transactions on or before this date, formatted YYYY-MM-DD.",
        },
        type: {
          type: "string",
          enum: ["uncategorized", "unapproved"],
        },
        limit: {
          type: "number",
          description: "Maximum number of transactions to return. Defaults to 25, max 100.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "ynab_get_plan_overview",
    description: "Get a compact overview of accounts, category groups, and the selected month.",
    inputSchema: {
      type: "object",
      properties: {
        plan_id: {
          type: "string",
          description: "YNAB plan id. Defaults to last-used.",
        },
        month: {
          type: "string",
          description: "Month in YYYY-MM-01 format. Defaults to the current month.",
        },
      },
      additionalProperties: false,
    },
  },
];

function getBearerToken(req: NextApiRequest): string | null {
  const authorization = req.headers.authorization;

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  const apiKey = req.headers["x-api-key"];
  return typeof apiKey === "string" ? apiKey : null;
}

function jsonRpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

function jsonRpcError(id: JsonRpcRequest["id"], code: number, message: string, data?: unknown) {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: {
      code,
      message,
      ...(data ? { data } : {}),
    },
  };
}

function toolText(payload: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function planId(args: Record<string, unknown>): string {
  return typeof args.plan_id === "string" && args.plan_id ? args.plan_id : DEFAULT_PLAN_ID;
}

async function resolveYnabAccessToken(req: NextApiRequest): Promise<string | undefined> {
  const bearerToken = getBearerToken(req);

  if (bearerToken && bearerToken === process.env.MCP_API_KEY) {
    return process.env.YNAB_ACCESS_TOKEN;
  }

  if (bearerToken?.startsWith("ynab_")) {
    return getYnabAccessTokenForSession(bearerToken);
  }

  if (!process.env.MCP_API_KEY) {
    return process.env.YNAB_ACCESS_TOKEN;
  }

  return undefined;
}

async function callTool(name: string, args: Record<string, unknown>, accessToken?: string) {
  switch (name) {
    case "ynab_list_plans":
      return toolText(await ynabGet("/plans", undefined, { accessToken }));

    case "ynab_list_accounts": {
      const response = await ynabGet<{ data: { accounts: Array<{ closed?: boolean }> } }>(
        `/plans/${encodeURIComponent(planId(args))}/accounts`,
        undefined,
        { accessToken }
      );
      const includeClosed = args.include_closed === true;
      return toolText({
        ...response,
        data: {
          ...response.data,
          accounts: includeClosed
            ? response.data.accounts
            : response.data.accounts.filter((account) => !account.closed),
        },
      });
    }

    case "ynab_list_categories": {
      const response = await ynabGet<{
        data: {
          category_groups: Array<{
            hidden?: boolean;
            deleted?: boolean;
            categories?: Array<{ hidden?: boolean; deleted?: boolean }>;
          }>;
        };
      }>(`/plans/${encodeURIComponent(planId(args))}/categories`, undefined, { accessToken });
      const includeHidden = args.include_hidden === true;
      return toolText({
        ...response,
        data: {
          ...response.data,
          category_groups: includeHidden
            ? response.data.category_groups
            : response.data.category_groups
                .filter((group) => !group.hidden && !group.deleted)
                .map((group) => ({
                  ...group,
                  categories: group.categories?.filter(
                    (category) => !category.hidden && !category.deleted
                  ),
                })),
        },
      });
    }

    case "ynab_get_month": {
      const month = typeof args.month === "string" && args.month ? args.month : currentMonth();
      return toolText(
        await ynabGet(
          `/plans/${encodeURIComponent(planId(args))}/months/${encodeURIComponent(month)}`,
          undefined,
          { accessToken }
        )
      );
    }

    case "ynab_list_transactions": {
      const selectedPlanId = encodeURIComponent(planId(args));
      const query = {
        since_date: typeof args.since_date === "string" ? args.since_date : undefined,
        until_date: typeof args.until_date === "string" ? args.until_date : undefined,
        type: typeof args.type === "string" ? args.type : undefined,
      };
      const limit = clampLimit(args.limit);
      let path = `/plans/${selectedPlanId}/transactions`;

      if (typeof args.account_id === "string" && args.account_id) {
        path = `/plans/${selectedPlanId}/accounts/${encodeURIComponent(args.account_id)}/transactions`;
      } else if (typeof args.category_id === "string" && args.category_id) {
        path = `/plans/${selectedPlanId}/categories/${encodeURIComponent(args.category_id)}/transactions`;
      } else if (typeof args.payee_id === "string" && args.payee_id) {
        path = `/plans/${selectedPlanId}/payees/${encodeURIComponent(args.payee_id)}/transactions`;
      } else if (typeof args.month === "string" && args.month) {
        path = `/plans/${selectedPlanId}/months/${encodeURIComponent(args.month)}/transactions`;
      }

      const response = await ynabGet<{ data: { transactions: unknown[] } }>(path, query, {
        accessToken,
      });

      return toolText({
        ...response,
        data: {
          ...response.data,
          transactions: response.data.transactions.slice(0, limit),
          limit,
          returned: Math.min(response.data.transactions.length, limit),
          total_available: response.data.transactions.length,
        },
      });
    }

    case "ynab_get_plan_overview": {
      const selectedPlanId = encodeURIComponent(planId(args));
      const month = typeof args.month === "string" && args.month ? args.month : currentMonth();
      const [accounts, categories, monthSummary] = await Promise.all([
        ynabGet(`/plans/${selectedPlanId}/accounts`, undefined, { accessToken }),
        ynabGet(`/plans/${selectedPlanId}/categories`, undefined, { accessToken }),
        ynabGet(`/plans/${selectedPlanId}/months/${encodeURIComponent(month)}`, undefined, {
          accessToken,
        }),
      ]);

      return toolText({
        plan_id: planId(args),
        selected_month: month,
        accounts,
        categories,
        month_summary: monthSummary,
      });
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleMcpRequest(request: JsonRpcRequest, req: NextApiRequest) {
  const id = request.id ?? null;

  if (request.method === "initialize") {
    return jsonRpcResult(id, {
      protocolVersion: "2025-06-18",
      capabilities: {
        tools: {},
      },
      serverInfo: SERVER_INFO,
    });
  }

  if (request.method === "tools/list") {
    return jsonRpcResult(id, { tools });
  }

  if (request.method === "tools/call") {
    const name = request.params?.name;

    if (!name) {
      return jsonRpcError(id, -32602, "Missing tool name");
    }

    const args = request.params?.arguments || {};
    const accessToken = await resolveYnabAccessToken(req);
    const result = await callTool(name, args, accessToken);
    return jsonRpcResult(id, result);
  }

  if (request.method?.startsWith("notifications/")) {
    return null;
  }

  return jsonRpcError(id, -32601, `Method not found: ${request.method || "unknown"}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      server: SERVER_INFO,
      endpoint: "/api/ynab-mcp",
      connect: "/api/ynab/oauth/connect",
      auth: "Use the OAuth connection token as Authorization: Bearer <token>.",
      tools: tools.map((tool) => tool.name),
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const request = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (Array.isArray(request)) {
      const responses = await Promise.all(request.map((item) => handleMcpRequest(item, req)));
      return res.status(200).json(responses.filter(Boolean));
    }

    const response = await handleMcpRequest(request, req);

    if (!response) {
      return res.status(204).end();
    }

    return res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    const status = error instanceof SyntaxError ? 400 : 200;
    return res.status(status).json(jsonRpcError(null, -32603, message));
  }
}
