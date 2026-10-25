ALTER TABLE "GenerationRequest" ADD COLUMN "executionScope" TEXT;
ALTER TABLE "GenerationRequest" ADD COLUMN "recoveryAttemptCount" INTEGER;
ALTER TABLE "GenerationRequest" ADD COLUMN "recoveryNextAttemptAt" TIMESTAMP(3);
ALTER TABLE "GenerationRequest" ADD COLUMN "recoveryLastError" TEXT;

CREATE INDEX "GenerationRequest_async_recovery_idx"
ON "GenerationRequest"("requestType", "executionScope", "status", "recoveryNextAttemptAt", "createdAt");
