// src/server/api/routers/mautic.ts
import { env } from "~/env.mjs";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const mauticRouter = createTRPCRouter({
  syncContacts: protectedProcedure.mutation(async ({ ctx }) => {
    // Fetch contacts from your Prisma database.
    // Here we assume that every user with an email is a contact.
    const contacts = await ctx.prisma.user.findMany({
      where: { email: { not: null } },
    });

    // Mautic API configuration
    const mauticBaseUrl = env.MAUTIC_BASE_URL!;
    const mauticUsername = env.MAUTIC_USERNAME!;
    const mauticPassword = env.MAUTIC_PASSWORD!;
    const authHeader =
      "Basic " + Buffer.from(`${mauticUsername}:${mauticPassword}`).toString("base64");

    interface MauticResponse {
      // Define the properties you expect, for example:
      contact?: any;
      errors?: string[];
      // ... add any other expected properties
    }
    // Loop through each contact and send it to Mautic.
    for (const contact of contacts || []) {
      // Option 1: Skip contacts without an email
      if (!contact.email) {
        console.warn("Skipping contact with no email.");
        continue;
      }

      // Option 2: Or use a fallback string in logs:
      // const emailForLog = contact.email ?? "unknown";

      // Split the user's name (assuming it's a string) into first and last names.
      const [firstname, ...rest] = contact.name ? contact.name.split(" ") : [""];
      const lastname = rest.join(" ") || "";

      try {
        const response = await fetch(`${mauticBaseUrl}/api/contacts/new`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            email: contact.email,
            firstname,
            lastname,
            credits: contact.credits,
          }),
        });
        const mauticData = await response.json() as MauticResponse;
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
