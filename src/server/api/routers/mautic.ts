// src/server/api/routers/mautic.ts
import { env } from "~/env.mjs";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { updateMauticContact } from "./mautic-utils";
import type { User } from "@prisma/client";


export const mauticRouter = createTRPCRouter({
  syncContacts: protectedProcedure.mutation(async ({ ctx }) => {
    const contacts: User[] = await ctx.prisma.user.findMany({
      where: { email: { not: null } },
    });

    for (const contact of contacts || []) {
      if (!contact.email) {
        console.warn("Skipping contact with no email.");
        continue;
      }
      try {
        const mauticData = await updateMauticContact({
          email: contact.email,
          name: contact.name,
          credits: contact.credits,
        });
        console.log(`Processed contact ${contact.email ?? "unknown"}:`, mauticData);
      } catch (err) {
        console.error(`Error processing contact ${contact.email ?? "unknown"}:`, err);
      }
    }

    return {
      message: "Contacts sync complete",
      total: contacts.length,
    };
  }),
});
