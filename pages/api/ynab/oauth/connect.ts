import type { NextApiRequest, NextApiResponse } from "next";
import { createYnabAuthorizationUrl } from "../../../../lib/ynab-oauth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authorizationUrl = await createYnabAuthorizationUrl(req);
    return res.redirect(302, authorizationUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start YNAB OAuth.";
    return res.status(500).json({ error: message });
  }
}
