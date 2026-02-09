-- AlterTable
ALTER TABLE "ProductOrder" ADD COLUMN     "color" TEXT,
ADD COLUMN     "colorHex" TEXT,
ADD COLUMN     "isBackgroundRemoved" BOOLEAN DEFAULT false,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "variantName" TEXT;
