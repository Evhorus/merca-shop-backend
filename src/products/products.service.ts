import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto, ProductVariantDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { FilesService } from 'src/files/files.service';
import { Color, Prisma, Product, ProductImage } from 'generated/prisma';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response';
import { CategoriesService } from 'src/categories/categories.service';
import { ProductWithAllRelations } from './interfaces/product-response.interface';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly cloudinary: CloudinaryService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    files: Array<Express.Multer.File>,
  ): Promise<ProductWithAllRelations> {
    this.validateCreateProductDto(createProductDto, files);

    await this.ensureProductDoesNotExist(createProductDto.name);

    await this.ensureCategoryExists(createProductDto.categoryId);

    return await this.prisma.$transaction(
      async (transaction): Promise<ProductWithAllRelations> => {
        try {
          // Create product
          const createdProduct = await this.createProduct(
            transaction,
            createProductDto,
          );

          // Create features
          const ProductFeatures = await this.createProductFeatures({
            features: createProductDto.features,
            productId: createdProduct.id,
            transaction,
          });

          // Create variants
          const productVariants = await this.createProductVariants({
            productId: createdProduct.id,
            transaction: transaction,
            variants: createProductDto.variants,
          });

          // Upload Images
          const uploadedImages = await this.filesService.uploadImages(
            files,
            `products/${createdProduct.id}`,
          );

          // Create Images
          const productImages = await this.createProductImages({
            imageNames: uploadedImages.fileNames,
            productId: createdProduct.id,
            transaction,
          });

          return {
            ...createdProduct,
            images: productImages,
            features: ProductFeatures,
            variants: productVariants,
          };
        } catch (error) {
          this.logger.error(`Transaction failed: ${error}`);
          throw error;
        }
      },
    );
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Product & { images: string[] }>> {
    const { limit = 10, offset = 0, q } = paginationDto;

    const where: Prisma.ProductWhereInput = {
      name: { contains: q, mode: 'insensitive' },
    };

    const [products, totalProducts] = await Promise.all([
      this.prisma.product.findMany({
        take: limit,
        skip: offset,
        include: { images: true },
        orderBy: { id: 'asc' },
        where,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      count: totalProducts,
      pages: Math.ceil(totalProducts / limit),
      data: products.map((product) => ({
        ...product,
        images: product.images.map((img) => img.image),
      })),
    };
  }

  async findOne({
    where,
    withImages,
    withFeatures,
    withVariants,
  }: {
    where: Prisma.ProductWhereUniqueInput;
    withImages?: boolean;
    withFeatures?: boolean;
    withVariants?: boolean;
  }): Promise<ProductWithAllRelations> {
    const include: Prisma.ProductInclude = {
      ...(withImages && { images: true }),
      ...(withFeatures && {
        features: { select: { name: true, value: true } },
      }),
      ...(withVariants && {
        variants: {
          include: {
            productVariantDimension: {
              select: { id: true, productVariantId: true },
            },
          },
          omit: { id: true },
        },
      }),
    };

    const product = await this.prisma.product.findUnique({
      where,
      include,
    });

    if (!product) {
      throw new NotFoundException(this.ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return {
      ...product,
      // images: withImages ? product.images.map((img) => img.image) : [],
    };
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

        if (updateProductDto.variants && updateProductDto.variants.length > 0) {
          await transaction.productVariant.deleteMany({
            where: { productId: updatedProduct.id },
          });

          await this.createProductVariants({
            productId: updatedProduct.id,
            transaction: transaction,
            variants: updateProductDto.variants,
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

        return {
          ...updatedProduct,
          images: imagesNames,
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

  private validateCreateProductDto(
    createProductDto: CreateProductDto,
    files: Array<Express.Multer.File>,
  ) {
    if (!createProductDto.variants || createProductDto.variants.length === 0) {
      throw new BadRequestException('At least one product variant is required');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one product image is required');
    }

    // Validar SKUs únicos dentro del DTO
    const skus = createProductDto.variants.map((v) => v.sku);
    const uniqueSkus = new Set(skus);
    if (skus.length !== uniqueSkus.size) {
      throw new BadRequestException('Duplicate SKUs in variants');
    }
  }

  private async ensureProductDoesNotExist(name: string) {
    const productExist = await this.prisma.product.findUnique({
      where: { name },
    });

    if (productExist) {
      throw new BadRequestException(this.ERROR_MESSAGES.PRODUCT_EXISTS);
    }
  }

  private async ensureProductVariantDoesNotExist(sku: string) {
    const productVariantExist = await this.prisma.productVariant.findUnique({
      where: { sku },
    });

    if (productVariantExist) {
      throw new BadRequestException(this.ERROR_MESSAGES.PRODUCT_VARIANT_EXISTS);
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
      },
    });
  }

  private async getOrCreateColor(
    transaction: Prisma.TransactionClient,
    color: ProductVariantDto['color'],
  ): Promise<Color> {
    const { colorCode, colorName } = color;

    const colorExists = await transaction.color.findUnique({
      where: {
        colorCode,
        colorName,
      },
    });

    if (!colorExists) {
      const color = await transaction.color.create({
        data: {
          colorCode,
          colorName,
        },
      });

      return color;
    }
    return colorExists;
  }

  private async createProductFeatures({
    features,
    productId,
    transaction,
  }: {
    features: CreateProductDto['features'];
    productId: string;
    transaction: Prisma.TransactionClient;
  }) {
    return await Promise.all(
      features.map((feature) =>
        transaction.productFeature.create({
          data: {
            ...feature,
            productId,
          },
        }),
      ),
    );
  }

  private async createProductVariants({
    productId,
    transaction,
    variants,
  }: {
    productId: string;
    transaction: Prisma.TransactionClient;
    variants: CreateProductDto['variants'];
  }): Promise<
    Prisma.ProductVariantGetPayload<{
      include: { productVariantDimension: true };
    }>[]
  > {
    return await Promise.all(
      variants.map(
        async (
          variant,
        ): Promise<
          Prisma.ProductVariantGetPayload<{
            include: { productVariantDimension: true };
          }>
        > => {
          await this.ensureProductVariantDoesNotExist(variant.sku);
          const { colorName } = await this.getOrCreateColor(
            transaction,
            variant.color,
          );

          const productVariant = await transaction.productVariant.create({
            data: {
              availableQuantity: variant.availableQuantity,
              color: colorName,
              price: this.normalizeNumberString(variant.price),
              sku: variant.sku,
              productId,
            },
            include: { productVariantDimension: true },
          });

          await transaction.productVariantDimension.create({
            data: {
              ...variant.dimensions,
              productVariantId: productVariant.id,
            },
          });

          return productVariant;
        },
      ),
    );
  }

  private async createProductImages({
    imageNames,
    productId,
    transaction,
  }: {
    imageNames: string[];
    productId: string;
    transaction: Prisma.TransactionClient;
  }): Promise<ProductImage[]> {
    return await Promise.all(
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
