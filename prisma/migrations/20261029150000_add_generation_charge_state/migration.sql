-- Additive synchronous-generation charge state. Historical requests remain NULL.
ALTER TABLE "GenerationRequest" ADD COLUMN "chargeState" TEXT;

ALTER TABLE "GenerationRequest"
  ADD CONSTRAINT "GenerationRequest_chargeState_check"
  CHECK ("chargeState" IS NULL OR "chargeState" IN ('pending', 'charged', 'refunded'));

