import { Module } from '@nestjs/common';

import { CloudinaryModule } from 'src/cloudinary';

import { FilesService } from './files.service';
import { FilesController } from './files.controller';

@Module({
  imports: [CloudinaryModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
