import { ProductVariantDimension } from './product-dimension.entity';

export class ProductVariant {
  availableQuantity: number;
  color: string;
  dimensions?: ProductVariantDimension;
  price: string;
  sku: string;
}
