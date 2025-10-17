/*
  Warnings:

  - You are about to drop the `ProductVariantColor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ProductVariant" DROP CONSTRAINT "ProductVariant_colorId_fkey";

-- DropTable
DROP TABLE "public"."ProductVariantColor";

-- CreateTable
CREATE TABLE "Colors" (
    "id" TEXT NOT NULL,
    "colorCode" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,

    CONSTRAINT "Colors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Colors_colorCode_key" ON "Colors"("colorCode");
