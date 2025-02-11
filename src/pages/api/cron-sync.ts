// pages/api/cron-sync.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { appRouter } from "~/server/api/root"; // Ensure this path is correct
import { createTRPCContext } from "~/server/api/trpc";
import { env } from "~/env.mjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check the Authorization header (Vercel will include CRON_SECRET as a Bearer token)
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Create tRPC context
    const ctx = await createTRPCContext({ req, res });
    // Create a caller from the router using the current context
    const caller = appRouter.createCaller(ctx);
    // Call the syncContacts mutation
    const result = await caller.mautic.syncContacts();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error syncing contacts via cron:", error);
    return res.status(500).json({ error: "Failed to sync contacts" });
  }
}
