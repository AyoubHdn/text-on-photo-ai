-- AlterTable
ALTER TABLE "ProductOrder" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "stripeSessionId" TEXT;
