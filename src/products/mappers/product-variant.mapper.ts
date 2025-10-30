import { Prisma } from 'generated/prisma';
import { ProductVariant } from '../interfaces/product.interface';

type PrismaProductVariantWithDimensions = Prisma.ProductVariantGetPayload<{
  include: { productVariantDimensions: true };
}>;

export class ProductVariantMapper {
  static toPresentation(
    prismaProductVariantWithDimensions: PrismaProductVariantWithDimensions,
  ): ProductVariant {
    return {
      sku: prismaProductVariantWithDimensions.sku,
      price: prismaProductVariantWithDimensions.price.toString(),
      color: prismaProductVariantWithDimensions.color,
      availableQuantity: prismaProductVariantWithDimensions.availableQuantity,
      ...(prismaProductVariantWithDimensions.productVariantDimensions && {
        dimensions: {
          ...(prismaProductVariantWithDimensions.productVariantDimensions
            .depth && {
            depth:
              prismaProductVariantWithDimensions.productVariantDimensions.depth?.toString(),
          }),
          ...(prismaProductVariantWithDimensions.productVariantDimensions
            .diameter && {
            diameter:
              prismaProductVariantWithDimensions.productVariantDimensions.depth?.toString(),
          }),
          height:
            prismaProductVariantWithDimensions.productVariantDimensions.height.toString(),
          length:
            prismaProductVariantWithDimensions.productVariantDimensions.length?.toString(),
          width:
            prismaProductVariantWithDimensions.productVariantDimensions.width?.toString(),
          unit: prismaProductVariantWithDimensions.productVariantDimensions
            .unit,
        },
      }),
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
