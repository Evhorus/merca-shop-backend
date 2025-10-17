import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FilesModule } from 'src/files/files.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CategoriesModule } from 'src/categories/categories.module';

@Module({
  imports: [PrismaModule, FilesModule, CloudinaryModule, CategoriesModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
