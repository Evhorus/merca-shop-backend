import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma';
import { FilesModule } from 'src/files';
import { CloudinaryModule } from 'src/cloudinary';

import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [PrismaModule, FilesModule, CloudinaryModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
