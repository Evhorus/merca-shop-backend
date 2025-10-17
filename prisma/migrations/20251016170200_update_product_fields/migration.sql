/*
  Warnings:

  - You are about to drop the `ProductVariantDimensions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ProductVariantDimensions" DROP CONSTRAINT "ProductVariantDimensions_productVariantId_fkey";

-- DropTable
DROP TABLE "public"."ProductVariantDimensions";

-- CreateTable
CREATE TABLE "ProductVariantDimension" (
    "id" TEXT NOT NULL,
    "length" DECIMAL(10,2) NOT NULL,
    "width" DECIMAL(10,2) NOT NULL,
    "height" DECIMAL(10,2) NOT NULL,
    "depth" DECIMAL(10,2),
    "diameter" DECIMAL(10,2),
    "unit" "Unit" NOT NULL,
    "productVariantId" TEXT NOT NULL,

    CONSTRAINT "ProductVariantDimension_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantDimension_productVariantId_key" ON "ProductVariantDimension"("productVariantId");

-- AddForeignKey
ALTER TABLE "ProductVariantDimension" ADD CONSTRAINT "ProductVariantDimension_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
