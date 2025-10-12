import { BadRequestException, Injectable } from '@nestjs/common';

import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class FilesService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadImage(file: Express.Multer.File, folderName: string) {
    if (!file) {
      throw new BadRequestException('Por favor, sube una imagen.');
    }

    const result = await this.cloudinaryService.uploadFile(file, folderName);
    return result;
  }

  async uploadImages(files: Array<Express.Multer.File>, folderName: string) {
    if (!files || !files.length) {
      throw new BadRequestException('Por favor, sube una imagen o varias');
    }

    try {
      const result = await Promise.all(
        files.map((file) =>
          this.cloudinaryService.uploadFile(file, folderName),
        ),
      );

      const fileNames = result.map((img) => {
        const parts = img.split('/');
        return parts[parts.length - 1];
      });

      return {
        fileNames: fileNames,
        fileUrls: result,
      };
    } catch (error) {
      console.error('Error uploading files:', error);
      throw new BadRequestException(
        'Error uploading images. Please try again.',
      );
    }
  }
}
