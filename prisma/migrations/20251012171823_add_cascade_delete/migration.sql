-- DropForeignKey
ALTER TABLE "public"."CategoryImage" DROP CONSTRAINT "CategoryImage_categoryId_fkey";

-- AddForeignKey
ALTER TABLE "CategoryImage" ADD CONSTRAINT "CategoryImage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
