import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma';
import { FilesModule } from 'src/files';
import { CloudinaryModule } from 'src/cloudinary';
import { CategoriesModule } from 'src/categories';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ColorsModule } from 'src/colors/colors.module';

@Module({
  imports: [
    PrismaModule,
    FilesModule,
    CloudinaryModule,
    CategoriesModule,
    ColorsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
