import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma } from 'generated/prisma';

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
  ) {
    await this.validateUniqueProduct(createCategoryDto);

    try {
      const createdCategory = await this.prisma.category.create({
        data: {
          isActive: createCategoryDto.isActive,
          name: createCategoryDto.name,
          slug: createCategoryDto.slug,
          description: createCategoryDto.description,
        },
      });

      if (files && files.length > 0) {
        const { fileNames } = await this.filesService.uploadImages(
          files,
          `categories/${createdCategory.id}`,
        );

        await this.prisma.categoryImage.createMany({
          data: fileNames.map((image) => ({
            categoryId: createdCategory.id,
            image,
          })),
        });
      }
      return createdCategory;
    } catch (error) {
      this.handleError(error, 'creating category');
    }
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
  ) {
    console.log(updateCategoryDto.description);
    await this.findOne({ where: { id } });
    await this.validateUniqueProduct(updateCategoryDto, id);
    try {
      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: {
          description: updateCategoryDto.description || null,
          isActive: updateCategoryDto.isActive,
          name: updateCategoryDto.name,
          slug: updateCategoryDto.slug,
        },
      });

      let imagesNames: string[] = updateCategoryDto.images || [];

      if (files && files.length > 0) {
        const { fileNames } = await this.filesService.uploadImages(
          files,
          `categories/${updatedCategory.id}`,
        );
        imagesNames.push(...fileNames);
      }
      imagesNames = Array.from(new Set(imagesNames));
      if (imagesNames.length > 0) {
        await this.prisma.categoryImage.deleteMany({
          where: { categoryId: updatedCategory.id },
        });

        // Create Images
        await this.prisma.categoryImage.createMany({
          data: imagesNames.map((image) => ({
            categoryId: updatedCategory.id,
            image,
          })),
        });
      }
      return updatedCategory;
    } catch (error) {
      this.handleError(error, 'updating category');
    }
  }

  // -- Remove Category --- //
  async remove(id: string): Promise<Category> {
    const category = await this.findOne({ where: { id } });

    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new ConflictException(
        'Cannot delete category because it has associated products',
      );
    }

    const deletedCategory = await this.prisma.category.delete({
      where: { id },
    });

    await this.cloudinary.deleteImagesByFolder(`categories/${category.id}`);

    return deletedCategory;
  }

  //----- Utils ----//
  private async validateUniqueProduct(
    dto: CreateCategoryDto | UpdateCategoryDto,
    excludeId?: string,
  ) {
    if (!dto.name && !dto.slug) {
      return;
    }

    const conditions: Prisma.CategoryWhereInput[] = [];

    if (dto.name) conditions.push({ name: dto.name });
    if (dto.slug) conditions.push({ slug: dto.slug });

    const existingProduct = await this.prisma.category.findFirst({
      where: {
        AND: [excludeId ? { NOT: { id: excludeId } } : {}, { OR: conditions }],
      },
      select: {
        name: true,
        slug: true,
      },
    });

    if (existingProduct) {
      if (dto.name && existingProduct.name === dto.name) {
        throw new ConflictException('A category with this name already exists');
      }
      if (dto.slug && existingProduct.slug === dto.slug) {
        throw new ConflictException('A category with this slug already exists');
      }
    }
  }

  private handleError(error: any, context: string): never {
    this.logger.error(`Error ${context}:`, error);

    // Si ya es una excepción HTTP de NestJS, re-lanzarla
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException ||
      error instanceof ConflictException
    ) {
      throw error;
    }

    // Manejar errores específicos de Prisma
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error.code === 'P2025') {
      throw new NotFoundException('Resource not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error.code === 'P2003') {
      throw new BadRequestException('Foreign key constraint failed');
    }

    // Error genérico
    throw new InternalServerErrorException(
      `An error occurred while ${context}`,
    );
  }
}
