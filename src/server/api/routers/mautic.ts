// ~/server/api/routers/mautic.ts
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { syncAllContactsToMautic } from "~/server/mautic/syncContacts";

export const mauticRouter = createTRPCRouter({
  syncContacts: protectedProcedure.mutation(async () => {
    return syncAllContactsToMautic();
  }),
});
