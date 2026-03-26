CREATE TABLE "GenerationRequest" (
    "id" TEXT NOT NULL,
    "generationRequestId" TEXT NOT NULL,
    "userId" TEXT,
    "sourcePage" TEXT,
    "requestType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'started',
    "predictionId" TEXT,
    "creditsCharged" DECIMAL(10,2),
    "resultImageUrls" JSONB,
    "errorMessage" TEXT,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GenerationRequest_generationRequestId_key"
ON "GenerationRequest"("generationRequestId");

CREATE INDEX "GenerationRequest_userId_createdAt_idx"
ON "GenerationRequest"("userId", "createdAt");

CREATE INDEX "GenerationRequest_status_updatedAt_idx"
ON "GenerationRequest"("status", "updatedAt");
