/*
  Warnings:

  - A unique constraint covering the columns `[categoryId,image]` on the table `CategoryImage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."CategoryImage_image_key";

-- CreateIndex
CREATE INDEX "CategoryImage_categoryId_idx" ON "CategoryImage"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryImage_categoryId_image_key" ON "CategoryImage"("categoryId", "image");
