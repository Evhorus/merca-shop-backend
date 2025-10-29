import { Injectable, Logger } from '@nestjs/common';
import { Category, CategoryImage, Prisma } from 'generated/prisma';

import {
  PaginationDto,
  PaginatedResponse,
  ResourceNotFoundException,
} from 'src/common';
import { PrismaService } from 'src/prisma';
import { FilesService } from 'src/files';
import { CloudinaryService } from 'src/cloudinary';

import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { CategoryWithAllRelations, CategoryWithImages } from './interfaces';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // --- Create Category --- //
  async create(
    createCategoryDto: CreateCategoryDto,
    files: Express.Multer.File[],
  ): Promise<CategoryWithImages> {
    return await this.prisma.$transaction(
      async (transaction): Promise<CategoryWithImages> => {
        try {
          // Create Category
          const createdCategory = await this.createCategoryWithTransaction(
            createCategoryDto,
            transaction,
          );

          const images = await this.filesService.uploadImages(
            files,
            `categories/${createdCategory.id}`,
          );

          const productImages = await this.createCategoryImagesWithTransaction({
            categoryId: createdCategory.id,
            images: images.fileNames,
            transaction,
          });

          return {
            ...createdCategory,
            images: productImages,
          };
        } catch (error) {
          this.logger.error(`Transaction failed: ${error}`);
          throw error;
        }
      },
    );
  }

  // --- Find All Categories Paginated -- //
  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<CategoryWithImages>> {
    const { limit = 10, offset = 0, q } = paginationDto;

    const where: Prisma.CategoryWhereInput = {
      name: { contains: q, mode: 'insensitive' },
    };

    const [categories, totalCategories] = await Promise.all([
      this.prisma.category.findMany({
        take: limit,
        skip: offset,
        include: { images: true, _count: { select: { products: true } } },
        orderBy: { id: 'asc' },
        where,
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      count: totalCategories,
      pages: Math.ceil(totalCategories / limit),
      data: categories.map((category) => ({
        ...category,
      })),
    };
  }

  // --- Find category --- //
  async findOne({
    where,
    withImages,
    withProducts,
    withProductCount,
  }: {
    where: Prisma.CategoryWhereUniqueInput;
    withImages?: boolean;
    withProducts?: boolean;
    withProductCount?: boolean;
  }): Promise<CategoryWithAllRelations> {
    const include: Prisma.CategoryInclude = {
      ...(withImages && { images: { select: { image: true } } }),
      ...(withProducts && {
        products: true,
        _count: { select: { products: true } },
      }),
      ...(withProductCount && { _count: { select: { products: true } } }),
    };

    const category = await this.prisma.category.findUnique({
      where,
      include,
    });

    if (!category) {
      throw new ResourceNotFoundException('Category');
    }

    return {
      ...category,
    };
  }

  // --- Update Category --- //
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    files: Array<Express.Multer.File>,
  ): Promise<CategoryWithImages> {
    await this.findOne({ where: { id } });
    return await this.prisma.$transaction(
      async (transaction): Promise<CategoryWithImages> => {
        let imagesNames: string[] = updateCategoryDto.images || [];
        try {
          // Update category
          const updatedCategory = await this.updateCategoryWithTransaction(
            id,
            updateCategoryDto,
            transaction,
          );

          if (files && files.length > 0) {
            const images = await this.filesService.uploadImages(
              files,
              `categories/${updatedCategory.id}`,
            );
            imagesNames.push(...images.fileNames);
          }

          imagesNames = Array.from(new Set(imagesNames));

          let createdImages: CategoryImage[] = [];

          if (imagesNames.length > 0) {
            await transaction.categoryImage.deleteMany({
              where: { categoryId: updatedCategory.id },
            });

            createdImages = await this.createCategoryImagesWithTransaction({
              categoryId: updatedCategory.id,
              images: imagesNames,
              transaction,
            });
          }

          return {
            ...updatedCategory,
            images: createdImages,
          };
        } catch (error) {
          this.logger.error(`Transaction failed: ${error}`);
          throw error;
        }
      },
    );
  }

  // -- Remove Category --- //
  async remove(id: string): Promise<Category> {
    const category = await this.findOne({ where: { id } });

    const deletedCategory = await this.prisma.category.delete({
      where: { id },
    });

    await this.cloudinary.deleteImagesByFolder(`products/${category.id}`);

    return deletedCategory;
  }

  async createCategoryWithTransaction(
    dto: CreateCategoryDto,
    transaction: Prisma.TransactionClient,
  ): Promise<Category> {
    return transaction.category.create({
      data: {
        description: dto.description,
        isActive: dto.isActive,
        name: dto.name,
        slug: dto.slug,
      },
    });
  }

  async updateCategoryWithTransaction(
    categoryId: string,
    dto: UpdateCategoryDto,
    transaction: Prisma.TransactionClient,
  ): Promise<Category> {
    return transaction.category.update({
      where: { id: categoryId },
      data: {
        description: dto.description,
        isActive: dto.isActive,
        name: dto.name,
        slug: dto.slug,
      },
    });
  }

  async createCategoryImagesWithTransaction({
    categoryId,
    images,
    transaction,
  }: {
    categoryId: string;
    images: string[];
    transaction: Prisma.TransactionClient;
  }): Promise<CategoryImage[]> {
    return await Promise.all(
      images.map((image) =>
        transaction.categoryImage.create({
          data: {
            categoryId: categoryId,
            image: image,
          },
        }),
      ),
    );
  }
}
