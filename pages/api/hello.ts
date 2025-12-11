
import type { NextApiRequest, NextApiResponse } from "next";
import logger from "../../lib/logger";

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	logger.info("/api/hello called", { method: req.method });
	res.status(200).json({ name: "John Doe" });
}
