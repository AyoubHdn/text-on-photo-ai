-- AlterTable
ALTER TABLE "User"
ADD COLUMN "ramadanAdUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "ramadanFreeCreditsGranted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "ramadanMugFreePreviewUsed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProductOrder"
ADD COLUMN "funnelSource" TEXT;
