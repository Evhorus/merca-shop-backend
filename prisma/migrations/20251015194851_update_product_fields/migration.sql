/*
  Warnings:

  - You are about to drop the `Colors` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."Colors";

-- CreateTable
CREATE TABLE "Color" (
    "id" TEXT NOT NULL,
    "colorCode" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Color_colorCode_key" ON "Color"("colorCode");
