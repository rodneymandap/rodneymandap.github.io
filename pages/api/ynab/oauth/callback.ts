import type { NextApiRequest, NextApiResponse } from "next";
import { completeYnabOAuth } from "../../../../lib/ynab-oauth";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function html(body: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>YNAB Connected</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; max-width: 720px; margin: 48px auto; padding: 0 24px; color: #111827; }
    code { display: block; overflow-wrap: anywhere; padding: 16px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; }
  </style>
</head>
<body>${body}</body>
</html>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";

  if (!code || !state) {
    return res.status(400).send(html("<h1>Connection failed</h1><p>Missing OAuth code or state.</p>"));
  }

  try {
    const sessionId = await completeYnabOAuth(code, state);
    return res.status(200).send(
      html(`<h1>YNAB connected</h1>
<p>Use this token as the bearer token for the MCP server:</p>
<code>${escapeHtml(sessionId)}</code>
<p>The YNAB access and refresh tokens are stored server-side. You can close this tab.</p>`)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to finish YNAB OAuth.";
    return res.status(500).send(html(`<h1>Connection failed</h1><p>${escapeHtml(message)}</p>`));
  }
}
