import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Param,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { FilesService } from './files.service';
import { fileFilter } from './helpers/file-filter';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter,
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadImage(file, 'testing');
  }

  @Post('upload-images/:folderName')
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      fileFilter,
    }),
  )
  uploadImages(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('folderName') folderName: string,
  ) {
    return this.filesService.uploadImages(files, folderName);
  }
}
