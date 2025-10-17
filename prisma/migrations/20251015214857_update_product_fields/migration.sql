/*
  Warnings:

  - A unique constraint covering the columns `[colorCode,colorName]` on the table `Color` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."ProductVariantDimensions" DROP CONSTRAINT "ProductVariantDimensions_productVariantId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "Color_colorCode_colorName_key" ON "Color"("colorCode", "colorName");

-- AddForeignKey
ALTER TABLE "ProductVariantDimensions" ADD CONSTRAINT "ProductVariantDimensions_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
