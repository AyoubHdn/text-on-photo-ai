-- AlterTable
ALTER TABLE "ProductOrder" ADD COLUMN     "snapshotBackgroundRemoved" BOOLEAN DEFAULT false,
ADD COLUMN     "snapshotColor" TEXT,
ADD COLUMN     "snapshotPrintPosition" TEXT,
ADD COLUMN     "snapshotSize" TEXT,
ADD COLUMN     "snapshotVariantId" INTEGER;
