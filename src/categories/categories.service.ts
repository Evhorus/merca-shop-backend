import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { FilesService } from 'src/files/files.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Category, Prisma } from 'generated/prisma';
import { CategoriesResponse } from './interfaces/categories-response.interface';
import { CategoryResponse } from './interfaces/category-response.interface';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    files: Express.Multer.File[],
  ): Promise<CategoryResponse> {
    const categoryExist = await this.prisma.category.findFirst({
      where: { name: createCategoryDto.name },
    });

    if (categoryExist) {
      throw new BadRequestException(this.ERROR_MESSAGES.CATEGORY_EXISTS);
    }

    return await this.prisma.$transaction(async (transaction) => {
      try {
        const createdCategory = await transaction.category.create({
          data: {
            name: createCategoryDto.name,
            description: createCategoryDto.description,
            isActive: createCategoryDto.isActive,
            slug: createCategoryDto.slug,
          },
          include: { images: true },
        });

        const images = await this.filesService.uploadImages(
          files,
          `categories/${createdCategory.id}`,
        );

        await Promise.all(
          images.fileNames.map((image) => {
            return transaction.categoryImage.create({
              data: {
                categoryId: createdCategory.id,
                image: image,
              },
            });
          }),
        );

        return {
          ...createdCategory,
          images: images.fileNames,
        };
      } catch (error) {
        this.logger.error(`Transaction failed: ${error}`);
        throw error;
      }
    });
  }

  async findAll(paginationDto: PaginationDto): Promise<CategoriesResponse> {
    const { limit = 10, offset = 0, q } = paginationDto;

    const where: Prisma.CategoryWhereInput = {
      name: { contains: q, mode: 'insensitive' },
    };

    const [categories, totalCategories] = await Promise.all([
      this.prisma.category.findMany({
        take: limit,
        skip: offset,
        include: { images: true },
        orderBy: { id: 'asc' },
        where,
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      count: totalCategories,
      pages: Math.ceil(totalCategories / limit),
      categories: categories.map((category) => ({
        ...category,
        images: category.images.map((img) => img.image),
      })),
    };
  }

  async findOne(id: string): Promise<CategoryResponse> {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
      include: { images: true },
    });

    if (!category) {
      throw new NotFoundException(this.ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    return { ...category, images: category.images.map((img) => img.image) };
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    files: Array<Express.Multer.File>,
  ): Promise<CategoryResponse> {
    await this.findOne(id);

    return await this.prisma.$transaction(async (transaction) => {
      try {
        const createdCategory = await transaction.category.update({
          where: { id },
          data: {
            name: updateCategoryDto.name,
            description: updateCategoryDto.description,
            isActive: updateCategoryDto.isActive,
            slug: updateCategoryDto.slug,
          },
        });

        let imagesNames: string[] = updateCategoryDto.images || [];

        if (files.length > 0) {
          const images = await this.filesService.uploadImages(
            files,
            `categories/${createdCategory.id}`,
          );
          imagesNames.push(...images.fileNames);
        }

        imagesNames = Array.from(new Set(imagesNames));

        if (imagesNames.length > 0) {
          await transaction.categoryImage.deleteMany({
            where: { categoryId: id },
          });
          await Promise.all(
            imagesNames.map((image) => {
              return transaction.categoryImage.create({
                data: {
                  categoryId: createdCategory.id,
                  image: image,
                },
              });
            }),
          );
        }

        return {
          ...createdCategory,
          images: imagesNames,
        };
      } catch (error) {
        this.logger.error(`Transaction failed: ${error}`);
        throw error;
      }
    });
  }

  async remove(id: string): Promise<Category> {
    const category = await this.findOne(id);
    const deleteCategory = await this.prisma.category.delete({
      where: { id },
    });
    await this.cloudinary.deleteImagesByFolder(`categories/${category.id}`);

    return deleteCategory;
  }

  private readonly ERROR_MESSAGES = {
    CATEGORY_EXISTS: 'Category with this name already exists',
    CATEGORY_NOT_FOUND: 'Category not found',
    CATEGORY_DELETED: 'Category deleted successfully',
  } as const;
}
