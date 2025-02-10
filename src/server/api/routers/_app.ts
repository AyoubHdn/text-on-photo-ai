// src/server/api/routers/_app.ts

import { createTRPCRouter } from "~/server/api/trpc";
import { mauticRouter } from "./mautic";
// ... import other routers as needed

export const appRouter = createTRPCRouter({
  mautic: mauticRouter,
  // ... other routers
});

export type AppRouter = typeof appRouter;
console.log("App router keys:", Object.keys(appRouter));