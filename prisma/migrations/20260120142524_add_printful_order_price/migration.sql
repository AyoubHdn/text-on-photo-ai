/*
  Warnings:

  - Added the required column `totalAmount` to the `PrintfulOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PrintfulOrder" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL;
