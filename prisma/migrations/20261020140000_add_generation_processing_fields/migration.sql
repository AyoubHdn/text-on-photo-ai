-- Additive async generation state-machine fields. Historical rows remain valid.
ALTER TABLE "GenerationRequest" ADD COLUMN "numberOfImages" INTEGER;
ALTER TABLE "GenerationRequest" ADD COLUMN "aspectRatio" TEXT;
ALTER TABLE "GenerationRequest" ADD COLUMN "processingStartedAt" TIMESTAMP(3);
ALTER TABLE "GenerationRequest" ADD COLUMN "leaseExpiresAt" TIMESTAMP(3);
ALTER TABLE "GenerationRequest" ADD COLUMN "processingAttemptId" TEXT;
