/*
  Warnings:

  - You are about to drop the `ProductVariantDimension` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ProductVariantDimension" DROP CONSTRAINT "ProductVariantDimension_productVariantId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "productDimensionId" TEXT;

-- DropTable
DROP TABLE "public"."ProductVariantDimension";

-- CreateTable
CREATE TABLE "ProductDimension" (
    "id" TEXT NOT NULL,
    "length" DECIMAL(10,2) NOT NULL,
    "width" DECIMAL(10,2) NOT NULL,
    "height" DECIMAL(10,2) NOT NULL,
    "depth" DECIMAL(10,2),
    "diameter" DECIMAL(10,2),
    "unit" "Unit" NOT NULL,
    "productVariantId" TEXT NOT NULL,

    CONSTRAINT "ProductDimension_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductDimension_productVariantId_key" ON "ProductDimension"("productVariantId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_productDimensionId_fkey" FOREIGN KEY ("productDimensionId") REFERENCES "ProductDimension"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDimension" ADD CONSTRAINT "ProductDimension_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
