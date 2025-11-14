import { Prisma } from 'generated/prisma';

export type CategoryWithImages = Prisma.CategoryGetPayload<{
  include: { images: { select: { image: true } } };
}>;

export type CategoryWithAllRelations = Prisma.CategoryGetPayload<{
  include: {
    images: { select: { image: true } };
    products: true;
    _count: { select: { products: true } };
    children: true;
  };
}>;
