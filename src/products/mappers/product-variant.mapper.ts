import { Prisma } from 'generated/prisma';
import { ProductVariant } from '../interfaces/product.interface';

type PrismaProductVariantWithDimensions = Prisma.ProductVariantGetPayload<{
  include: { productVariantDimensions: true };
}>;

export class ProductVariantMapper {
  static toPresentation(
    prismaProductVariantWithDimensions: PrismaProductVariantWithDimensions,
  ): ProductVariant {
    if (!prismaProductVariantWithDimensions.productVariantDimensions) {
      throw new Error(
        'Product variant dimensions are required for transformation.',
      );
    }

    const { depth, diameter, height, length, unit, width } =
      prismaProductVariantWithDimensions.productVariantDimensions;

    return {
      sku: prismaProductVariantWithDimensions.sku,
      price: prismaProductVariantWithDimensions.price.toString(),
      color: prismaProductVariantWithDimensions.color,
      availableQuantity: prismaProductVariantWithDimensions.availableQuantity,
      dimensions: {
        ...(depth && { depth: depth?.toString() }),
        ...(diameter && { diameter: depth?.toString() }),
        height: height.toString(),
        length: length?.toString(),
        width: width?.toString(),
        unit: unit,
      },
    };
  }

  static toPresentationArray(
    prismaProductVariantWithDimensions: PrismaProductVariantWithDimensions[],
  ): ProductVariant[] {
    return prismaProductVariantWithDimensions.map((v) =>
      this.toPresentation(v),
    );
  }
}
