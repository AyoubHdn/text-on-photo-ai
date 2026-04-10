import type { NextApiRequest } from "next";
import { env } from "~/env.mjs";

export function isAuthorizedCronRequest(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  return Boolean(authHeader && authHeader === `Bearer ${env.CRON_SECRET}`);
}
