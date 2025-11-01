import { ProductFeature } from './product-feature.entity';
import { ProductVariant } from './product-variant.entity';

export class ProductDimensions {
  length: string;
  width: string;
  height: string;
  unit: Unit;
}

export enum Unit {
  cm = 'cm',
  in = 'in',
  mm = 'mm',
  m = 'm',
}

export class Product {
  brand: string;
  categoryId: string;
  id: string;
  images: string[];
  sku: string;
  price: string;
  isActive: boolean;
  name: string;
  origin: string;
  slug: string;
  stock: number;
  colorId?: string;
  description?: string;
  dimensions?: ProductDimensions;
  features?: ProductFeature[];
  variants?: ProductVariant[];
}
