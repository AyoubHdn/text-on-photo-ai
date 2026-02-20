import { User } from "@prisma/client";
import { prisma } from "~/server/db";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";

export type SyncContactsResult = {
  message: string;
  total: number;
  processed: number;
  failed: number;
};

export async function syncAllContactsToMautic(): Promise<SyncContactsResult> {
  const contacts: User[] = await prisma.user.findMany({
    where: { email: { not: null } },
  });

  console.log(
    "Fetched contacts:",
    contacts.map((c) => ({ email: c.email, credits: c.credits, plan: c.plan })),
  );

  let processedCount = 0;
  let failedCount = 0;

  for (const contact of contacts || []) {
    if (!contact.email) {
      console.warn("Skipping contact with no email:", contact.id);
      continue;
    }

    try {
      console.log("Sending to Mautic:", {
        email: contact.email,
        credits: contact.credits,
        plan: contact.plan,
      });

      const mauticData = await updateMauticContact(
        {
          email: contact.email,
          name: contact.name,
          brand_specific_credits: contact.credits,
          brand_specific_plan: contact.plan,
        },
        "namedesignai",
      );

      if (mauticData.errors?.length) {
        throw new Error(mauticData.errors.map((error) => error.message).join("; "));
      }

      console.log(`Processed contact ${contact.email}:`, mauticData);
      processedCount++;
    } catch (err) {
      failedCount++;
      console.error(`Error processing contact ${contact.email}:`, err);
    }
  }

  return {
    message: "Contacts sync complete",
    total: contacts.length,
    processed: processedCount,
    failed: failedCount,
  };
}
