import { ProductFeature } from './product-feature.entity';
import { ProductVariant } from './product-variant.entity';

export class Product {
  brand: string;
  categoryId: string;
  description: string;
  id: string;
  images: string[];
  isActive: boolean;
  name: string;
  origin: string;
  slug: string;
  features?: ProductFeature[];
  variants?: ProductVariant[];
}
