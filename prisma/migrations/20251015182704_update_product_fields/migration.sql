/*
  Warnings:

  - The `depth` column on the `ProductVariantDimensions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `diameter` column on the `ProductVariantDimensions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `productVariantId` to the `ProductVariantDimensions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `length` on the `ProductVariantDimensions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `width` on the `ProductVariantDimensions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `height` on the `ProductVariantDimensions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."ProductVariant" DROP CONSTRAINT "ProductVariant_dimensionsId_fkey";

-- AlterTable
ALTER TABLE "ProductVariantDimensions" ADD COLUMN     "productVariantId" TEXT NOT NULL,
DROP COLUMN "length",
ADD COLUMN     "length" DECIMAL(10,2) NOT NULL,
DROP COLUMN "width",
ADD COLUMN     "width" DECIMAL(10,2) NOT NULL,
DROP COLUMN "height",
ADD COLUMN     "height" DECIMAL(10,2) NOT NULL,
DROP COLUMN "depth",
ADD COLUMN     "depth" DECIMAL(10,2),
DROP COLUMN "diameter",
ADD COLUMN     "diameter" DECIMAL(10,2);

-- AddForeignKey
ALTER TABLE "ProductVariantDimensions" ADD CONSTRAINT "ProductVariantDimensions_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
