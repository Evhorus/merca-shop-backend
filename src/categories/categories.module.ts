import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma';

import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [PrismaModule, MediaModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
