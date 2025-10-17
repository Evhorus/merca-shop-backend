/*
  Warnings:

  - You are about to drop the column `colorId` on the `ProductVariant` table. All the data in the column will be lost.
  - Added the required column `color` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "colorId",
ADD COLUMN     "color" TEXT NOT NULL;
