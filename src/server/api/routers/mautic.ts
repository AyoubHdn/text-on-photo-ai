// ~/server/api/routers/mautic.ts
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { updateMauticContact } from "./mautic-utils";
import { User } from "@prisma/client"; // Import from Prisma

export const mauticRouter = createTRPCRouter({
  syncContacts: protectedProcedure.mutation(async ({ ctx }) => {
    const contacts: User[] = await ctx.prisma.user.findMany({
      where: { email: { not: null } },
    });

    let processedCount = 0;

    for (const contact of contacts || []) {
      if (!contact.email) {
        console.warn("Skipping contact with no email:", contact.id);
        continue;
      }
      try {
        const mauticData = await updateMauticContact({
          email: contact.email,
          name: contact.name,
          credits: contact.credits,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          plan: contact.plan, // Now recognized
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