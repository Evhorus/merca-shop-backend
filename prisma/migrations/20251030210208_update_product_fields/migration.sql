/*
  Warnings:

  - You are about to drop the `ProductDimension` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ProductDimension" DROP CONSTRAINT "ProductDimension_productId_fkey";

-- DropTable
DROP TABLE "public"."ProductDimension";

-- CreateTable
CREATE TABLE "ProductDimensions" (
    "id" TEXT NOT NULL,
    "length" DECIMAL(10,2) NOT NULL,
    "width" DECIMAL(10,2) NOT NULL,
    "height" DECIMAL(10,2) NOT NULL,
    "depth" DECIMAL(10,2),
    "diameter" DECIMAL(10,2),
    "unit" "Unit" NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ProductDimensions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductDimensions_productId_key" ON "ProductDimensions"("productId");

-- AddForeignKey
ALTER TABLE "ProductDimensions" ADD CONSTRAINT "ProductDimensions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
