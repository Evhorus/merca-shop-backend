import { Injectable } from '@nestjs/common';
import { cloudinary } from 'src/config/cloudinary.config';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
    folderName: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: folderName,
            public_id: `${file.originalname.split('.')[0]}-${uuid()}`,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              return reject(new Error(error.message || 'Upload failed'));
            }
            if (!result || !result.secure_url) {
              return reject(
                new Error('Upload failed: no result or secure_url'),
              );
            }
            resolve(result?.secure_url);
          },
        )
        .end(file.buffer);
    });
  }
}
