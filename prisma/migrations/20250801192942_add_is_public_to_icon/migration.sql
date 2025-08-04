-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('None', 'Starter', 'Pro', 'Elite');

-- AlterTable
ALTER TABLE "Icon" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'None',
ALTER COLUMN "credits" SET DEFAULT 1;
