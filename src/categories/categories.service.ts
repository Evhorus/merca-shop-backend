import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma } from 'generated/prisma';

import { ResourceNotFoundException } from 'src/common';
import { PrismaService } from 'src/prisma';

import {
  CategoryOptionsQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto';
import { CategoryWithAllRelations } from './interfaces';
import { MediaService } from 'src/media/media.service';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  /**
   * Creates a new category, validates relations, and uploads images
   */
  async create(
    createCategoryDto: CreateCategoryDto,
    files: Express.Multer.File[],
  ) {
    await this.validateUniqueCategory(createCategoryDto);

    // Validate parent category existence and max depth (no more than 2 levels)
    if (createCategoryDto.parentId) {
      const parentCategory = await this.findOne({
        where: { id: createCategoryDto.parentId },
        withImages: false,
        withProducts: false,
      });

      if (parentCategory.parentId) {
        throw new BadRequestException(
          `Cannot create a subcategory under "${parentCategory.name}" because it is already a subcategory. Only two category levels are allowed.`,
        );
      }
    }

    try {
      const createdCategory = await this.prisma.category.create({
        data: {
          isActive: createCategoryDto.isActive,
          name: createCategoryDto.name,
          slug: createCategoryDto.slug,
          description: createCategoryDto.description,
          parentId: createCategoryDto.parentId || null,
        },
      });

      // Upload images using MediaService
      if (files && files.length > 0) {
        await this.mediaService.uploadImages(
          'category',
          createdCategory.id,
          files,
        );
      }

      return createdCategory;
    } catch (error) {
      this.handleError(error, 'creating category');
    }
  }

  /**
   * Returns paginated categories, includes child categories and relations based on options
   */
  async findAll(categoryOptionsQueryDto: CategoryOptionsQueryDto) {
    const {
      limit = 10,
      offset = 0,
      q,
      withImages,
      withProductCount,
      withProducts,
      onlyRoot,
      onlyChildren,
      currentCategoryId,
    } = categoryOptionsQueryDto;

    const where: Prisma.CategoryWhereInput = {
      name: { contains: q, mode: 'insensitive' },
      ...(onlyRoot ? { parentId: null } : {}),
      ...(onlyChildren ? { parentId: { not: null } } : {}),
      ...(currentCategoryId ? { NOT: { id: currentCategoryId } } : {}),
    };

    const include = this.buildCategoryInclude({
      withImages,
      withProducts,
      withProductCount,
    });

    const result = await Promise.all([
      this.prisma.category.findMany({
        include: {
          ...include,
          children: { include },
        },
        orderBy: { id: 'asc' },
        where,
        take: limit,
        skip: offset,
      }),
      this.prisma.category.count({ where }),
    ]);

    const totalCategories = result[1];
    const categories = result[0];
    return {
      count: totalCategories,
      pages: Math.ceil(totalCategories / limit),
      data: categories,
    };
  }

  /**
   * Finds a category, includes relations based on options
   */
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
    const include = this.buildCategoryInclude({
      withImages,
      withProducts,
      withProductCount,
    });

    const category = await this.prisma.category.findUnique({
      where,
      include,
    });

    if (!category) {
      throw new ResourceNotFoundException('Category');
    }

    return category;
  }

  /**
   * Updates category info, validates relations and updates images
   */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    files: Array<Express.Multer.File>,
  ) {
    await this.validateUniqueCategory(updateCategoryDto, id);

    // Validate parent relationship and max depth
    if (updateCategoryDto.parentId) {
      await this.validateNoCyclicReference(id, updateCategoryDto.parentId);
      const parentCategory = await this.findOne({
        where: { id: updateCategoryDto.parentId },
        withImages: false,
        withProducts: false,
      });

      if (parentCategory.parentId) {
        throw new BadRequestException(
          `Cannot assign "${parentCategory.name}" as parent because it is already a subcategory. Only two category levels are allowed.`,
        );
      }
    }

    try {
      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: {
          description: updateCategoryDto.description || null,
          isActive: updateCategoryDto.isActive,
          name: updateCategoryDto.name,
          slug: updateCategoryDto.slug,
          parentId: updateCategoryDto.parentId || null,
        },
      });

      // Replace images using MediaService
      await this.mediaService.replaceImages(
        'category',
        updatedCategory.id,
        updateCategoryDto.images || [],
        files,
      );

      return updatedCategory;
    } catch (error) {
      this.handleError(error, 'updating category');
    }
  }

  /**
   * Removes a category. Fails if products are associated.
   */
  async remove(id: string): Promise<Category> {
    await this.findOne({ where: { id } });

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

    // Delete images using MediaService
    await this.mediaService.deleteImagesByEntity('category', id);

    return deletedCategory;
  }

  /**
   * Helper: builds Prisma include object for relations based on options
   */

  private buildCategoryInclude(options: {
    withImages?: boolean;
    withProducts?: boolean;
    withProductCount?: boolean;
  }): Prisma.CategoryInclude {
    const { withImages, withProducts, withProductCount } = options;

    return {
      ...(withImages && { images: { select: { image: true } } }),
      ...(withProducts && { products: true }),
      ...(withProductCount && { _count: { select: { products: true } } }),
    };
  }

  /**
   * Recursively validates that there are no cyclic parent-child relations
   */
  private async validateNoCyclicReference(
    categoryId: string,
    newParentId: string,
    visitedIds: Set<string> = new Set(),
    depth: number = 0,
    MAX_DEPTH: number = 50,
  ): Promise<void> {
    // Direct self-reference validation
    if (categoryId === newParentId) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    // Protection against infinite loops
    if (depth > MAX_DEPTH) {
      throw new BadRequestException('Maximum category nesting depth exceeded');
    }

    // Circular reference detection
    if (visitedIds.has(newParentId)) {
      throw new BadRequestException(
        'Circular reference detected in category structure',
      );
    }

    visitedIds.add(newParentId);

    // Get the parent of the new parent category
    const parentCategory = await this.prisma.category.findUnique({
      where: { id: newParentId },
      select: { parentId: true },
    });

    if (!parentCategory) {
      throw new NotFoundException('Parent category not found');
    }

    // If parent has no parent, there is no cycle
    if (!parentCategory.parentId) {
      return;
    }

    // Recursively validate the parent of the parent
    await this.validateNoCyclicReference(
      categoryId,
      parentCategory.parentId,
      visitedIds,
      depth + 1,
      MAX_DEPTH,
    );
  }

  /**
   * Checks for existing category by name or slug (unique constraint)
   */
  private async validateUniqueCategory(
    dto: CreateCategoryDto | UpdateCategoryDto,
    excludeId?: string,
  ) {
    if (!dto.name && !dto.slug) {
      return;
    }

    const conditions: Prisma.CategoryWhereInput[] = [];

    if (dto.name) conditions.push({ name: dto.name });
    if (dto.slug) conditions.push({ slug: dto.slug });

    const existingCategory = await this.prisma.category.findFirst({
      where: {
        AND: [excludeId ? { NOT: { id: excludeId } } : {}, { OR: conditions }],
      },
      select: {
        name: true,
        slug: true,
      },
    });

    if (existingCategory) {
      if (dto.name && existingCategory.name === dto.name) {
        throw new ConflictException('A category with this name already exists');
      }
      if (dto.slug && existingCategory.slug === dto.slug) {
        throw new ConflictException('A category with this slug already exists');
      }
    }
  }

  /**
   * Handles known Prisma and NestJS errors, throws a specific error if possible, otherwise internal server error.
   */
  private handleError(error: unknown, context: string): never {
    this.logger.error(`Error ${context}:`, error);

    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException ||
      error instanceof ConflictException
    ) {
      throw error;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Resource not found');
      }

      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint failed');
      }
    }

    throw new InternalServerErrorException(
      `An error occurred while ${context}`,
    );
  }
}
