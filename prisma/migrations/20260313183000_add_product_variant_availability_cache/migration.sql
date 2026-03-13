-- CreateTable
CREATE TABLE "ProductVariantAvailabilityCache" (
    "id" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "variantId" INTEGER NOT NULL,
    "sizeKey" TEXT NOT NULL,
    "color" TEXT,
    "countryCode" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariantAvailabilityCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantAvailabilityCache_productType_variantId_countryCode_key"
ON "ProductVariantAvailabilityCache"("productType", "variantId", "countryCode");

-- CreateIndex
CREATE INDEX "ProductVariantAvailabilityCache_productType_countryCode_idx"
ON "ProductVariantAvailabilityCache"("productType", "countryCode");
