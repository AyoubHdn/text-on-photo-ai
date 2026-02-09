-- Add transparent background fields to Icon
ALTER TABLE "Icon"
ADD COLUMN "transparentImageUrl" TEXT,
ADD COLUMN "backgroundRemovedAt" TIMESTAMP(3);
