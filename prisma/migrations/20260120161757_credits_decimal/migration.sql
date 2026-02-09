/*
  Warnings:

  - You are about to alter the column `credits` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "credits" SET DEFAULT 1.0,
ALTER COLUMN "credits" SET DATA TYPE DECIMAL(10,2);
