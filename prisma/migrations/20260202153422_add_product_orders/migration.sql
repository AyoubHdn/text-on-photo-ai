/*
  Warnings:

  - You are about to drop the column `currency` on the `PrintfulOrder` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `PrintfulOrder` table. All the data in the column will be lost.
  - You are about to drop the column `mockupUrl` on the `PrintfulOrder` table. All the data in the column will be lost.
  - You are about to drop the column `productKey` on the `PrintfulOrder` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `PrintfulOrder` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `PrintfulOrder` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `PrintfulOrder` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productOrderId]` on the table `PrintfulOrder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productOrderId` to the `PrintfulOrder` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PrintfulOrder" DROP CONSTRAINT "PrintfulOrder_userId_fkey";

-- AlterTable
ALTER TABLE "PrintfulOrder" DROP COLUMN "currency",
DROP COLUMN "imageUrl",
DROP COLUMN "mockupUrl",
DROP COLUMN "productKey",
DROP COLUMN "totalAmount",
DROP COLUMN "userId",
DROP COLUMN "variantId",
ADD COLUMN     "productOrderId" TEXT NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ProductOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productKey" TEXT NOT NULL,
    "variantId" INTEGER NOT NULL,
    "aspect" TEXT,
    "previewMode" TEXT,
    "imageUrl" TEXT NOT NULL,
    "mockupUrl" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrintfulOrder_productOrderId_key" ON "PrintfulOrder"("productOrderId");

-- AddForeignKey
ALTER TABLE "PrintfulOrder" ADD CONSTRAINT "PrintfulOrder_productOrderId_fkey" FOREIGN KEY ("productOrderId") REFERENCES "ProductOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOrder" ADD CONSTRAINT "ProductOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
