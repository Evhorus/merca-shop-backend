/*
  Warnings:

  - A unique constraint covering the columns `[productVariantId]` on the table `ProductVariantDimensions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantDimensions_productVariantId_key" ON "ProductVariantDimensions"("productVariantId");
