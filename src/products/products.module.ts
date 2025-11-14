import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma';
import { CategoriesModule } from 'src/categories';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ColorsModule } from 'src/colors/colors.module';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [PrismaModule, CategoriesModule, ColorsModule, MediaModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
