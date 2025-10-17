import { Category } from 'generated/prisma';

export type CategoryWithImages = Category & { images: string[] };
