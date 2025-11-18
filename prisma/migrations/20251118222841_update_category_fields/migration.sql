/*
  Warnings:

  - You are about to drop the column `origin` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "origin",
ALTER COLUMN "brand" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;
