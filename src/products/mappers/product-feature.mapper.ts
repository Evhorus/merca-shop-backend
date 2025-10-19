import { ProductFeature as PrismaProductFeature } from 'generated/prisma';
import { ProductFeature } from '../interfaces/product.interface';

export class ProductFeatureMapper {
  static toPresentation(
    prismaProductFeature: PrismaProductFeature,
  ): ProductFeature {
    return {
      name: prismaProductFeature.name,
      value: prismaProductFeature.value,
    };
  }

  static toPresentationArray(prismaProductFeatures: PrismaProductFeature[]) {
    return prismaProductFeatures.map((f) => this.toPresentation(f));
  }
}
