import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
import { CloudinaryService } from 'src/cloudinary';
import { FilesService } from 'src/files';

type MediaType = 'category' | 'product';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /**
   * Uploads images for any entity type (category/product)
   */
  async uploadImages(
    type: MediaType,
    entityId: string,
    files: Express.Multer.File[],
  ): Promise<string[]> {
    if (!files || files.length === 0) return [];

    const folder = this.getFolderPath(type, entityId);
    const { fileNames } = await this.filesService.uploadImages(files, folder);

    await this.insertImages(type, entityId, fileNames);

    return fileNames;
  }

  /**
   * Deletes all images for an entity from storage
   */
  async deleteImagesByEntity(type: MediaType, entityId: string): Promise<void> {
    const folder = this.getFolderPath(type, entityId);
    await this.cloudinary.deleteImagesByFolder(folder);
  }

  /**
   * Replaces images for an entity (deletes old ones and uploads new)
   */
  async replaceImages(
    type: MediaType,
    entityId: string,
    existingImages: string[],
    newFiles: Express.Multer.File[],
  ): Promise<string[]> {
    const folder = this.getFolderPath(type, entityId);
    const imageSet = new Set<string>(existingImages || []);

    // Upload new files and add to existing images
    if (newFiles && newFiles.length > 0) {
      const { fileNames } = await this.filesService.uploadImages(
        newFiles,
        folder,
      );
      fileNames.forEach((fileName) => imageSet.add(fileName));
    }

    const finalImages = Array.from(imageSet);

    // Delete all old images from database and insert new ones
    await this.deleteImages(type, entityId);
    await this.insertImages(type, entityId, finalImages);

    return finalImages;
  }

  /**
   * Helper: Returns the folder path based on entity type
   */
  private getFolderPath(type: MediaType, entityId: string): string {
    const folderName = type === 'category' ? 'categories' : 'products';
    return `${folderName}/${entityId}`;
  }

  /**
   * Helper: Inserts images into the correct table
   */
  private async insertImages(
    type: MediaType,
    entityId: string,
    fileNames: string[],
  ): Promise<void> {
    switch (type) {
      case 'category':
        await this.prisma.categoryImage.createMany({
          data: fileNames.map((image) => ({
            categoryId: entityId,
            image,
          })),
        });
        break;

      case 'product':
        await this.prisma.productImage.createMany({
          data: fileNames.map((image) => ({
            productId: entityId,
            image,
          })),
        });
        break;
    }
  }

  /**
   * Helper: Deletes all images from the correct table
   */
  private async deleteImages(type: MediaType, entityId: string): Promise<void> {
    switch (type) {
      case 'category':
        await this.prisma.categoryImage.deleteMany({
          where: { categoryId: entityId },
        });
        break;

      case 'product':
        await this.prisma.productImage.deleteMany({
          where: { productId: entityId },
        });
        break;
    }
  }
}
