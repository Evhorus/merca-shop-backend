import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma';
import { FilesModule } from 'src/files';
import { CloudinaryModule } from 'src/cloudinary';
import { MediaService } from './media.service';

@Module({
  imports: [PrismaModule, FilesModule, CloudinaryModule],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
