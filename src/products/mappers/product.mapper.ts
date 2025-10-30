import { Prisma } from 'generated/prisma';

import { ProductVariantMapper } from './product-variant.mapper';
import { ProductFeatureMapper } from './product-feature.mapper';
import { Product, Unit } from '../entities';

type PrismaProduct = Prisma.ProductGetPayload<{
  include: {
    images: true;
    productFeatures: true;
    productVariants: { include: { productVariantDimensions: true } };
    productDimensions: true;
  };
}>;

export class ProductMapper {
  static toPresentation(prismaProduct: PrismaProduct): Product {
    return {
      brand: prismaProduct.brand,
      categoryId: prismaProduct.categoryId,
      description: prismaProduct.description,
      id: prismaProduct.id,
      images: prismaProduct.images.map((img) => img.image),
      isActive: prismaProduct.isActive,
      name: prismaProduct.name,
      origin: prismaProduct.origin,
      price: prismaProduct.price.toString(),
      sku: prismaProduct.sku,
      slug: prismaProduct.slug,
      ...(prismaProduct.productDimensions && {
        dimensions: {
          height: prismaProduct.productDimensions.height.toString(),
          length: prismaProduct.productDimensions.length.toString(),
          width: prismaProduct.productDimensions.width.toString(),
          unit: prismaProduct.productDimensions.unit as Unit,
        },
      }),
      ...(prismaProduct.productFeatures && {
        features: prismaProduct.productFeatures.map((f) => ({
          name: f.name,
          value: f.value,
        })),
      }),
    };
  }

  static toPresentationFull(prismaProduct: PrismaProduct): Product {
    return {
      ...this.toPresentation(prismaProduct),
      variants: ProductVariantMapper.toPresentationArray(
        prismaProduct.productVariants,
      ),
      features: ProductFeatureMapper.toPresentationArray(
        prismaProduct.productFeatures,
      ),
    };
  }

  static toPresentationArray(prismaProduct: PrismaProduct[]): Product[] {
    return prismaProduct.map((p) => this.toPresentation(p));
  }
}
