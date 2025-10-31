import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';

import { PrismaService } from 'src/prisma';
import { CloudinaryService } from 'src/cloudinary';
import { FilesService } from 'src/files';
import { PaginationDto, PaginatedResponse } from 'src/common';
import { CategoriesService } from 'src/categories/categories.service';
import { ColorsService } from 'src/colors';

import { ProductMapper } from './mappers';
import { CreateProductDto, UpdateProductDto } from './dto';
import { Product } from './entities';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly cloudinary: CloudinaryService,
    private readonly categoriesService: CategoriesService,
    private readonly colorsService: ColorsService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    files: Array<Express.Multer.File>,
  ) {
    await this.validateUniqueProduct(createProductDto);

    await this.categoriesService.findOne({
      where: { id: createProductDto.categoryId },
    });

    try {
      const createdProduct = await this.prisma.$transaction(
        async (transaction) => {
          const product = await transaction.product.create({
            data: {
              brand: createProductDto.brand,
              categoryId: createProductDto.categoryId,
              description: createProductDto.description,
              isActive: createProductDto.isActive,
              name: createProductDto.name,
              origin: createProductDto.origin,
              slug: createProductDto.slug,
              price: createProductDto.price,
              sku: createProductDto.sku,
            },
          });
          if (createProductDto.features) {
            await transaction.productFeature.createMany({
              data: createProductDto.features.map((feature) => ({
                ...feature,
                productId: product.id,
              })),
            });
          }

          if (createProductDto.dimensions) {
            await transaction.productDimensions.create({
              data: {
                ...createProductDto.dimensions,
                productId: product.id,
              },
            });
          }

          return product;
        },
      );
      if (files && files.length > 0) {
        const { fileNames } = await this.filesService.uploadImages(
          files,
          `products/${createdProduct.id}`,
        );

        await this.prisma.productImage.createMany({
          data: fileNames.map((image) => ({
            productId: createdProduct.id,
            image,
          })),
        });
      }

      return createdProduct;
    } catch (error) {
      this.handleError(error, 'creating product');
    }
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Product>> {
    const { limit = 10, offset = 0, q } = paginationDto;

    const where: Prisma.ProductWhereInput = {
      name: { contains: q, mode: 'insensitive' },
    };

    const [products, totalProducts] = await Promise.all([
      this.prisma.product.findMany({
        take: limit,
        skip: offset,
        include: {
          images: true,
          productFeatures: true,
          productVariants: { include: { productVariantDimensions: true } },
          productDimensions: true,
        },
        orderBy: { id: 'asc' },
        where,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      count: totalProducts,
      pages: Math.ceil(totalProducts / limit),
      data: ProductMapper.toPresentationArray(products),
    };
  }

  async findOne({
    where,
  }: {
    where: Prisma.ProductWhereUniqueInput;
  }): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where,
      include: {
        images: true,
        productFeatures: true,
        productVariants: {
          include: {
            productVariantDimensions: true,
          },
        },
        productDimensions: true,
      },
    });

    if (!product) {
      throw new NotFoundException(this.ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return ProductMapper.toPresentationFull(product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files: Array<Express.Multer.File>,
  ) {
    await this.findOne({ where: { id } });
    await this.validateUniqueProduct(updateProductDto, id);

    try {
      const updatedProduct = await this.prisma.$transaction(
        async (transaction) => {
          const product = await transaction.product.update({
            where: { id },
            data: {
              brand: updateProductDto.brand,
              categoryId: updateProductDto.categoryId,
              description: updateProductDto.description,
              isActive: updateProductDto.isActive,
              name: updateProductDto.name,
              origin: updateProductDto.origin,
              slug: updateProductDto.slug,
              price: updateProductDto.price,
              sku: updateProductDto.sku,
            },
          });

          if (updateProductDto.dimensions) {
            await transaction.productDimensions.deleteMany({
              where: { productId: product.id },
            });

            await transaction.productDimensions.create({
              data: {
                ...updateProductDto.dimensions,
                productId: product.id,
              },
            });
          } else {
            await transaction.productDimensions.deleteMany({
              where: { productId: product.id },
            });
          }

          if (
            updateProductDto.features &&
            updateProductDto.features?.length > 0
          ) {
            await transaction.productFeature.deleteMany({
              where: { productId: product.id },
            });

            await transaction.productFeature.createMany({
              data: updateProductDto.features.map((feature) => ({
                ...feature,
                productId: product.id,
              })),
            });
          }

          return product;
        },
      );

      let imagesNames: string[] = updateProductDto.images || [];

      if (files && files.length > 0) {
        // Upload Images
        const { fileNames } = await this.filesService.uploadImages(
          files,
          `products/${updatedProduct.id}`,
        );
        imagesNames.push(...fileNames);
      }

      imagesNames = Array.from(new Set(imagesNames));

      if (imagesNames.length > 0) {
        await this.prisma.productImage.deleteMany({
          where: { productId: updatedProduct.id },
        });

        // Create Images
        await this.prisma.productImage.createMany({
          data: imagesNames.map((image) => ({
            productId: updatedProduct.id,
            image,
          })),
        });
      }
      return updatedProduct;
    } catch (error) {
      this.handleError(error, 'updating product');
    }
  }

  async remove(id: string) {
    const product = await this.findOne({ where: { id } });

    const deleteProduct = await this.prisma.product.delete({
      where: { id },
    });
    await this.cloudinary.deleteImagesByFolder(`products/${product.id}`);

    return deleteProduct;
  }

  //----- Utils ----//
  private async validateUniqueProduct(
    dto: CreateProductDto | UpdateProductDto,
    excludeId?: string,
  ) {
    if (!dto.name && !dto.sku && !dto.slug) {
      return;
    }

    const conditions: Prisma.ProductWhereInput[] = [];

    if (dto.name) conditions.push({ name: dto.name });
    if (dto.sku) conditions.push({ sku: dto.sku });
    if (dto.slug) conditions.push({ slug: dto.slug });

    const existingProduct = await this.prisma.product.findFirst({
      where: {
        AND: [excludeId ? { NOT: { id: excludeId } } : {}, { OR: conditions }],
      },
      select: {
        name: true,
        sku: true,
        slug: true,
      },
    });

    if (existingProduct) {
      if (dto.name && existingProduct.name === dto.name) {
        throw new ConflictException('A product with this name already exists');
      }
      if (dto.sku && existingProduct.sku === dto.sku) {
        throw new ConflictException('A product with this SKU already exists');
      }
      if (dto.slug && existingProduct.slug === dto.slug) {
        throw new ConflictException('A product with this slug already exists');
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

  private readonly ERROR_MESSAGES = {
    PRODUCT_VARIANT_EXISTS: 'Product variant already exists',
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_DELETED: 'Product deleted successfully',
    COLOR_NOT_FOUND: 'Color not found',
  } as const;
}
