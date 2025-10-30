/*
  Warnings:

  - You are about to drop the column `productDimensionId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `productVariantId` on the `ProductDimension` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId]` on the table `ProductDimension` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productId` to the `ProductDimension` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_productDimensionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductDimension" DROP CONSTRAINT "ProductDimension_productVariantId_fkey";

-- DropIndex
DROP INDEX "public"."ProductDimension_productVariantId_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "productDimensionId";

-- AlterTable
ALTER TABLE "ProductDimension" DROP COLUMN "productVariantId",
ADD COLUMN     "productId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProductDimension_productId_key" ON "ProductDimension"("productId");

-- AddForeignKey
ALTER TABLE "ProductDimension" ADD CONSTRAINT "ProductDimension_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
