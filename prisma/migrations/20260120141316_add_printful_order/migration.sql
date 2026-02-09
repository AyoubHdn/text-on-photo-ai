-- CreateTable
CREATE TABLE "PrintfulOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "printfulOrderId" TEXT NOT NULL,
    "productKey" TEXT NOT NULL,
    "variantId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "mockupUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintfulOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrintfulOrder" ADD CONSTRAINT "PrintfulOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
