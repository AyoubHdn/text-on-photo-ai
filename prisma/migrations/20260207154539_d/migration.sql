-- AlterTable
ALTER TABLE "PrintfulOrder" ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "trackingCarrier" TEXT,
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "trackingStatus" TEXT,
ADD COLUMN     "trackingUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "trackingUrl" TEXT;
