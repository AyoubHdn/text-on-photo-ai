-- CreateTable
CREATE TABLE "ProductPricingCache" (
    "id" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "sizeKey" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "baseCost" DECIMAL(10,2) NOT NULL,
    "shippingCost" DECIMAL(10,2) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPricingCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductPricingCache_productType_sizeKey_countryCode_key" ON "ProductPricingCache"("productType", "sizeKey", "countryCode");
