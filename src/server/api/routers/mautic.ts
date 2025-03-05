// ~/server/api/routers/mautic.ts
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { updateMauticContact } from "./mautic-utils";
import { User } from "@prisma/client";

export const mauticRouter = createTRPCRouter({
  syncContacts: protectedProcedure.mutation(async ({ ctx }) => {
    const contacts: User[] = await ctx.prisma.user.findMany({
      where: { email: { not: null } },
    });

    console.log("Fetched contacts:", contacts.map(c => ({ email: c.email, credits: c.credits, plan: c.plan })));

    let processedCount = 0;

    for (const contact of contacts || []) {
      if (!contact.email) {
        console.warn("Skipping contact with no email:", contact.id);
        continue;
      }
      try {
        console.log("Sending to Mautic:", { email: contact.email, credits: contact.credits, plan: contact.plan });
        const mauticData = await updateMauticContact({
          email: contact.email,
          name: contact.name,
          credits: contact.credits,
          plan: contact.plan,
        });
        console.log(`Processed contact ${contact.email}:`, mauticData);
        processedCount++;
      } catch (err) {
        console.error(`Error processing contact ${contact.email}:`, err);
      }
    }

    return {
      message: "Contacts sync complete",
      total: contacts.length,
      processed: processedCount,
    };
  }),
});