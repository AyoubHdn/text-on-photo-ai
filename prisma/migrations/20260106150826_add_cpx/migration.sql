-- CreateEnum
CREATE TYPE "CpaStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "CpaResult" AS ENUM ('complete', 'screenout_bonus', 'screenout_no_bonus', 'reversed');

-- CreateEnum
CREATE TYPE "CpaNetwork" AS ENUM ('cpx');

-- CreateTable
CREATE TABLE "CpaUnlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "network" "CpaNetwork" NOT NULL,
    "status" "CpaStatus" NOT NULL DEFAULT 'pending',
    "result" "CpaResult",
    "transactionId" TEXT,
    "payout" DOUBLE PRECISION,
    "currency" TEXT,
    "leadIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),

    CONSTRAINT "CpaUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CpaUnlock_token_key" ON "CpaUnlock"("token");

-- AddForeignKey
ALTER TABLE "CpaUnlock" ADD CONSTRAINT "CpaUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
