import {
  Prisma,
  Product,
  ProductVariant,
  ProductVariantDimension,
} from 'generated/prisma';

export type ProductWithImages = Product & { images: string[] };

export type ProductWithAllRelations = Prisma.ProductGetPayload<{
  include: {
    features: true;
    variants: true;
    images: { select: { image: true } };
  };
}>;

export type ProductImage = Prisma.ProductImageGetPayload<{
  select: { image: true };
}>;

export type ProductVariantWithDimensions = ProductVariant & {
  productVariantDimension: ProductVariantDimension;
};
