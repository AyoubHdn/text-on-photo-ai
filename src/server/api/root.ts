import { createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "~/server/api/routers/user";
import { generateRouter } from "~/server/api/routers/generate";
import { checkoutRouter } from "~/server/api/routers/checkout";
import { iconRouter } from "./routers/icons";
import { mauticRouter } from "~/server/api/routers/mautic";
import { s3Router } from "~/server/api/routers/s3";
import { photoGiftRouter } from "~/server/api/routers/photoGift";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  generate: generateRouter,
  checkout: checkoutRouter,
  icons: iconRouter,
  mautic: mauticRouter,
  s3: s3Router,
  photoGift: photoGiftRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
