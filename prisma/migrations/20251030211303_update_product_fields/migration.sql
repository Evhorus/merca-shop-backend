/*
  Warnings:

  - You are about to drop the column `depth` on the `ProductDimensions` table. All the data in the column will be lost.
  - You are about to drop the column `diameter` on the `ProductDimensions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductDimensions" DROP COLUMN "depth",
DROP COLUMN "diameter";
