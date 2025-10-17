/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `ProductImage` table. All the data in the column will be lost.
  - Made the column `categoryId` on table `CategoryImage` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `image` to the `ProductImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CategoryImage" ALTER COLUMN "categoryId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProductImage" DROP COLUMN "fileUrl",
ADD COLUMN     "image" TEXT NOT NULL;
