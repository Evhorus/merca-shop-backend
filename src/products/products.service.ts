import {
  BadRequestException,
  Injectable,
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

import { ProductFeatureMapper, ProductMapper } from './mappers';
import { CreateProductDto, UpdateProductDto } from './dto';
import { Product, ProductFeature } from './entities';

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
    await this.ensureProductDoesNotExist(createProductDto.name);

    await this.ensureCategoryExists(createProductDto.categoryId);

    return await this.prisma.$transaction(async (transaction) => {
      try {
        // Create product
        const createdProduct = await this.createProduct(
          transaction,
          createProductDto,
        );

        if (createProductDto.features) {
          await this.createProductFeatures({
            features: createProductDto.features,
            productId: createdProduct.id,
            transaction,
          });
        }

        if (createProductDto.dimensions) {
          await this.prisma.productDimensions.create({
            data: {
              ...createProductDto.dimensions,
              productId: createdProduct.id,
            },
          });
        }
        const { fileNames } = await this.filesService.uploadImages(
          files,
          `products/${createdProduct.id}`,
        );

        if (files && files.length > 0) {
          await this.createProductImages({
            imageNames: fileNames,
            productId: createdProduct.id,
            transaction,
          });
        }
        return {
          ...createdProduct,
        };
      } catch (error) {
        this.logger.error(`Transaction failed: ${error}`);
        throw error;
      }
    });
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

    return this.prisma.$transaction(async (transaction) => {
      let imagesNames: string[] = updateProductDto.images || [];
      try {
        // update product
        const updatedProduct = await this.updateProduct({
          dto: updateProductDto,
          productId: id,
          transaction,
        });

        if (updateProductDto.dimensions) {
          await transaction.productDimensions.deleteMany({
            where: { productId: updatedProduct.id },
          });

          await transaction.productDimensions.create({
            data: {
              ...updateProductDto.dimensions,
              productId: updatedProduct.id,
            },
          });
        } else {
          await transaction.productDimensions.deleteMany({
            where: { productId: updatedProduct.id },
          });
        }

        if (files && files.length > 0) {
          // Upload Images
          const images = await this.filesService.uploadImages(
            files,
            `products/${updatedProduct.id}`,
          );

          imagesNames.push(...images.fileNames);
        }

        imagesNames = Array.from(new Set(imagesNames));

        if (imagesNames.length > 0) {
          await transaction.productImage.deleteMany({
            where: { productId: updatedProduct.id },
          });

          // Create Images
          await this.createProductImages({
            imageNames: imagesNames,
            productId: updatedProduct.id,
            transaction,
          });
        }

        if (
          updateProductDto.features &&
          updateProductDto.features?.length > 0
        ) {
          await transaction.productFeature.deleteMany({
            where: { productId: updatedProduct.id },
          });

          await this.createProductFeatures({
            features: updateProductDto.features,
            productId: updatedProduct.id,
            transaction,
          });
        }

        return {
          ...updatedProduct,
        };
      } catch (error) {
        this.logger.error(`Transaction failed: ${error}`);
        throw error;
      }
    });
  }

  async remove(id: string) {
    const product = await this.findOne({ where: { id } });

    const deleteProduct = await this.prisma.product.delete({
      where: { id },
    });
    await this.cloudinary.deleteImagesByFolder(`products/${product.id}`);

    return deleteProduct;
  }

  private async ensureProductDoesNotExist(name: string) {
    const productExist = await this.prisma.product.findUnique({
      where: { name },
    });

    if (productExist) {
      throw new BadRequestException(this.ERROR_MESSAGES.PRODUCT_EXISTS);
    }
  }

  private async ensureCategoryExists(categoryId: string) {
    await this.categoriesService.findOne({ where: { id: categoryId } });
  }

  private async createProduct(
    transaction: Prisma.TransactionClient,
    dto: CreateProductDto,
  ) {
    return await transaction.product.create({
      data: {
        brand: dto.brand,
        categoryId: dto.categoryId,
        description: dto.description,
        isActive: dto.isActive,
        name: dto.name,
        origin: dto.origin,
        slug: dto.slug,
        price: dto.price,
        sku: dto.sku,
      },
    });
  }

  private async updateProduct({
    dto,
    productId,
    transaction,
  }: {
    dto: UpdateProductDto;
    productId: string;
    transaction: Prisma.TransactionClient;
  }) {
    return await transaction.product.update({
      where: { id: productId },
      data: {
        brand: dto.brand,
        categoryId: dto.categoryId,
        description: dto.description,
        isActive: dto.isActive,
        name: dto.name,
        origin: dto.origin,
        slug: dto.slug,
        price: dto.price,
        sku: dto.sku,
      },
    });
  }

  private async createProductFeatures({
    features,
    productId,
    transaction,
  }: {
    features: CreateProductDto['features'];
    productId: string;
    transaction: Prisma.TransactionClient;
  }): Promise<ProductFeature[]> {
    if (!features) {
      throw new BadRequestException(
        'Features no present on create (createProductFeatures)',
      );
    }

    const createdFeatures = await Promise.all(
      features.map((feature) =>
        transaction.productFeature.create({
          data: {
            ...feature,
            productId,
          },
        }),
      ),
    );

    return ProductFeatureMapper.toPresentationArray(createdFeatures);
  }

  private async createProductImages({
    imageNames,
    productId,
    transaction,
  }: {
    imageNames: string[];
    productId: string;
    transaction: Prisma.TransactionClient;
  }): Promise<void> {
    await Promise.all(
      imageNames.map((image) =>
        transaction.productImage.create({
          data: {
            productId,
            image,
          },
        }),
      ),
    );
  }

  private normalizeNumberString(value: string): number {
    const cleaned = value.replace(/\./g, '');
    const n = Number(cleaned);
    return n;
  }

  private readonly ERROR_MESSAGES = {
    PRODUCT_EXISTS: 'Product already exists',
    PRODUCT_VARIANT_EXISTS: 'Product variant already exists',
    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_DELETED: 'Product deleted successfully',
    COLOR_NOT_FOUND: 'Color not found',
  } as const;
}

// private async ensureProductVariantDoesNotExist(sku: string) {
//   const productVariantExist = await this.prisma.productVariant.findUnique({
//     where: { sku },
//   });

//   if (productVariantExist) {
//     throw new BadRequestException(this.ERROR_MESSAGES.PRODUCT_VARIANT_EXISTS);
//   }
// }

// private async createProductVariantsWithTransaction({
//   productId,
//   transaction,
//   variants,
// }: {
//   productId: string;
//   transaction: Prisma.TransactionClient;
//   variants: CreateProductDto['variants'];
// }): Promise<ProductVariant[]> {
//   const createdProductVariants = await Promise.all(
//     variants.map(async (variant) => {
//       await this.ensureProductVariantDoesNotExist(variant.sku);

//       const { colorName } = await this.colorsService.findOne({
//         colorName: variant.colorName,
//       });

//       const productVariant = await transaction.productVariant.create({
//         data: {
//           availableQuantity: variant.availableQuantity,
//           color: colorName,
//           price: this.normalizeNumberString(variant.price),
//           sku: variant.sku,
//           productId,
//         },
//         include: {
//           productVariantDimensions: true,
//         },
//       });

//       // if (variant.dimensions) {
//       //   await transaction.productVariantDimension.create({
//       //     data: {
//       //       ...variant.dimensions,
//       //       productVariantId: productVariant.id,
//       //     },
//       //   });
//       // }

//       return productVariant;
//     }),
//   );

//   return ProductVariantMapper.toPresentationArray(createdProductVariants);
// }
