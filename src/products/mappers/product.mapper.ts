import { Prisma } from 'generated/prisma';
import { Product } from '../interfaces/product.interface';
import { ProductVariantMapper } from './product-variant.mapper';
import { ProductFeatureMapper } from './product-feature.mapper';

type PrismaProductFull = Prisma.ProductGetPayload<{
  include: {
    productFeatures: true;
    images: true;
    productVariants: { include: { productVariantDimensions: true } };
  };
}>;

type PrismaProductSimple = Prisma.ProductGetPayload<{
  include: {
    images: true;
  };
}>;

export class ProductMapper {
  static toPresentation(prismaProductSimple: PrismaProductSimple): Product {
    return {
      brand: prismaProductSimple.brand,
      categoryId: prismaProductSimple.categoryId,
      description: prismaProductSimple.description,
      id: prismaProductSimple.id,
      isActive: prismaProductSimple.isActive,
      name: prismaProductSimple.name,
      origin: prismaProductSimple.origin,
      slug: prismaProductSimple.slug,
      images: prismaProductSimple.images.map((img) => img.image),
    };
  }

  static toPresentationFull(prismaProductFull: PrismaProductFull): Product {
    return {
      ...this.toPresentation(prismaProductFull),
      variants: ProductVariantMapper.toPresentationArray(
        prismaProductFull.productVariants,
      ),
      features: ProductFeatureMapper.toPresentationArray(
        prismaProductFull.productFeatures,
      ),
    };
  }

  static toPresentationArray(
    prismaProductSimple: PrismaProductSimple[],
  ): Product[] {
    return prismaProductSimple.map((p) => this.toPresentation(p));
  }
}
