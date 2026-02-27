ALTER TABLE "User"
RENAME COLUMN "ramadanAdUser" TO "paidTrafficUser";

ALTER TABLE "User"
RENAME COLUMN "ramadanFreeCreditsGranted" TO "paidTrafficFreeCreditsGranted";

ALTER TABLE "User"
RENAME COLUMN "ramadanMugFreePreviewUsed" TO "paidTrafficFreePreviewUsed";

ALTER TABLE "User"
ADD COLUMN "hasGeneratedDesign" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hasVisitedCheckout" BOOLEAN NOT NULL DEFAULT false;
