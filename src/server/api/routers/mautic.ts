// src/server/api/routers/mautic.ts
import { env } from "~/env.mjs";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { User } from "@prisma/client";

export interface MauticResponse {
  contact?: unknown;
  errors?: string[];
  [key: string]: unknown;
}

export async function updateMauticContact(contact: {
  email: string;
  name?: string | null;
  credits?: number;
}): Promise<MauticResponse> {
  const mauticBaseUrl = env.MAUTIC_BASE_URL!;
  const mauticUsername = env.MAUTIC_USERNAME!;
  const mauticPassword = env.MAUTIC_PASSWORD!;
  const authHeader =
    "Basic " + Buffer.from(`${mauticUsername}:${mauticPassword}`).toString("base64");

  // Split the name into first and last names.
  const [firstname, ...rest] = contact.name ? contact.name.split(" ") : [""];
  const lastname = rest.join(" ") || "";

  // Build payload for update or creation.
  // If credits is defined, send "No credits" when it's 0; otherwise, send the credit value as a string.
  const payload: { [key: string]: unknown } = {
    email: contact.email,
    firstname,
    lastname,
  };

  if (contact.credits !== undefined) {
    payload.credits = contact.credits === 0 ? "No credits" : String(contact.credits);
  }

  const response = await fetch(`${mauticBaseUrl}/api/contacts/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as MauticResponse;
  return data;
}

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
