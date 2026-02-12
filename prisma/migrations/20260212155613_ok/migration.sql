-- CreateTable
CREATE TABLE "DeliveryEmailSchedule" (
    "id" TEXT NOT NULL,
    "productOrderId" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "maxDeliveryDays" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3),
    "processingAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryEmailSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryEmailSchedule_productOrderId_key" ON "DeliveryEmailSchedule"("productOrderId");

-- CreateIndex
CREATE INDEX "DeliveryEmailSchedule_deliveryDate_sentAt_idx" ON "DeliveryEmailSchedule"("deliveryDate", "sentAt");

-- AddForeignKey
ALTER TABLE "DeliveryEmailSchedule" ADD CONSTRAINT "DeliveryEmailSchedule_productOrderId_fkey" FOREIGN KEY ("productOrderId") REFERENCES "ProductOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
