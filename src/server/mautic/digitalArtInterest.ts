import type { Prisma, PrismaClient } from "@prisma/client";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";

export const DIGITAL_ART_INTERESTS = [
  "name_art",
  "arabic_name_art",
  "couples_art",
] as const;

export type DigitalArtInterest = (typeof DIGITAL_ART_INTERESTS)[number];

export const MAUTIC_FIRST_DIGITAL_ART_INTEREST_ALIAS =
  "first_digital_art_interes";
export const MAUTIC_LATEST_DIGITAL_ART_INTEREST_ALIAS =
  "latest_digital_art_intere";

const DIGITAL_ART_INTEREST_BY_SOURCE_PAGE: Record<string, DigitalArtInterest> = {
  "name-art-generator": "name_art",
  "arabic-name-art-generator": "arabic_name_art",
  "couples-art-generator": "couples_art",
};

export function getDigitalArtInterestFromSourcePage(
  sourcePage: string | null | undefined,
): DigitalArtInterest | null {
  const normalizedSourcePage = sourcePage?.trim().toLowerCase();
  if (!normalizedSourcePage) return null;
  return DIGITAL_ART_INTEREST_BY_SOURCE_PAGE[normalizedSourcePage] ?? null;
}

type StoredInterestRow = {
  firstInterest: string | null;
  latestInterest: string | null;
};

function normalizeDigitalArtInterest(
  value: string | null | undefined,
): DigitalArtInterest | null {
  if (!value) return null;
  return DIGITAL_ART_INTERESTS.includes(value as DigitalArtInterest)
    ? (value as DigitalArtInterest)
    : null;
}

function getSourcePageFromIconMetadata(
  metadata: Prisma.JsonValue | null | undefined,
): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const sourcePage = (metadata as { sourcePage?: unknown }).sourcePage;
  return typeof sourcePage === "string" ? sourcePage : null;
}

async function getStoredDigitalArtInterestSummary(params: {
  prisma: PrismaClient;
  userId: string;
}) {
  const rows = await params.prisma.$queryRaw<StoredInterestRow[]>`
    SELECT
      "firstDigitalArtInterest" AS "firstInterest",
      "latestDigitalArtInterest" AS "latestInterest"
    FROM "User"
    WHERE "id" = ${params.userId}
    LIMIT 1
  `;

  const row = rows[0];
  return {
    firstInterest: normalizeDigitalArtInterest(row?.firstInterest),
    latestInterest: normalizeDigitalArtInterest(row?.latestInterest),
  };
}

async function deriveDigitalArtInterestSummaryFromIcons(params: {
  prisma: PrismaClient;
  userId: string;
}) {
  const icons = await params.prisma.icon.findMany({
    where: { userId: params.userId },
    orderBy: { createdAt: "asc" },
    select: { metadata: true },
  });

  let firstInterest: DigitalArtInterest | null = null;
  let latestInterest: DigitalArtInterest | null = null;

  for (const icon of icons) {
    const interest = getDigitalArtInterestFromSourcePage(
      getSourcePageFromIconMetadata(icon.metadata),
    );
    if (!interest) continue;

    if (!firstInterest) firstInterest = interest;
    latestInterest = interest;
  }

  return {
    firstInterest,
    latestInterest,
  };
}

export async function getDigitalArtInterestSummary(params: {
  prisma: PrismaClient;
  userId: string;
}) {
  const storedSummary = await getStoredDigitalArtInterestSummary(params);
  if (storedSummary.firstInterest || storedSummary.latestInterest) {
    return storedSummary;
  }

  return deriveDigitalArtInterestSummaryFromIcons(params);
}

export async function recordDigitalArtInterest(params: {
  prisma: PrismaClient;
  userId: string;
  interest: DigitalArtInterest;
}) {
  const [user, summary] = await Promise.all([
    params.prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, name: true, credits: true },
    }),
    getDigitalArtInterestSummary({
      prisma: params.prisma,
      userId: params.userId,
    }),
  ]);

  if (!user?.email) return user;

  const firstInterest = summary.firstInterest ?? params.interest;
  const latestInterest = params.interest;

  await params.prisma.$executeRaw`
    UPDATE "User"
    SET
      "firstDigitalArtInterest" = COALESCE("firstDigitalArtInterest", ${firstInterest}),
      "latestDigitalArtInterest" = ${latestInterest}
    WHERE "id" = ${params.userId}
  `;

  try {
    await updateMauticContact(
      {
        email: user.email,
        name: user.name,
        brand_specific_credits: user.credits,
        customFields: {
          [MAUTIC_FIRST_DIGITAL_ART_INTEREST_ALIAS]: firstInterest,
          [MAUTIC_LATEST_DIGITAL_ART_INTEREST_ALIAS]: latestInterest,
        },
      },
      "namedesignai",
    );
  } catch (error) {
    console.error(
      `Failed to sync digital art interest for ${user.email}:`,
      error,
    );
  }

  return user;
}
