export type Product = {
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
};

export type ProductFeature = {
  name: string;
  value: string;
};

export type ProductVariant = {
  availableQuantity: number;
  color: string;
  dimensions: ProductVariantDimensions;
  price: string;
  sku: string;
};

export type ProductVariantDimensions = {
  height: string;
  length: string;
  unit: string;
  width: string;
  depth?: string;
  diameter?: string;
};
