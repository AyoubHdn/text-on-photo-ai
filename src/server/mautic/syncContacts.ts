import { User } from "@prisma/client";
import { prisma } from "~/server/db";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";

export type SyncContactsResult = {
  message: string;
  total: number;
  processed: number;
  failed: number;
  nextCursor: string | null;
  hasMore: boolean;
};

type SyncContactsOptions = {
  limit?: number;
  cursor?: string | null;
};

export async function syncAllContactsToMautic(
  options: SyncContactsOptions = {},
): Promise<SyncContactsResult> {
  const batchSize = Math.min(Math.max(options.limit ?? 100, 1), 500);
  const total = await prisma.user.count({
    where: { email: { not: null } },
  });

  const contacts: User[] = await prisma.user.findMany({
    where: { email: { not: null } },
    orderBy: { id: "asc" },
    take: batchSize,
    ...(options.cursor
      ? {
          cursor: { id: options.cursor },
          skip: 1,
        }
      : {}),
  });

  console.log("Fetched contacts batch:", {
    count: contacts.length,
    limit: batchSize,
    cursor: options.cursor ?? null,
    total,
  });

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

  const nextCursor = contacts.length > 0 ? contacts[contacts.length - 1]!.id : null;
  const hasMore = contacts.length === batchSize;

  return {
    message: hasMore ? "Contacts sync batch complete" : "Contacts sync complete",
    total,
    processed: processedCount,
    failed: failedCount,
    nextCursor,
    hasMore,
  };
}
