import { BadRequestException } from '@nestjs/common';

export const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file) return callback(new Error('File is empty'), false);

  const fileExtension = file.mimetype.split('/')[1];
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];

  if (validExtensions.includes(fileExtension)) {
    return callback(null, true);
  }

  callback(
    new BadRequestException(
      `The file ${file.originalname} is not a valid image. Please use accepted formats: JPG, JPEG, PNG, or GIF.`,
    ),
    false,
  );
};
