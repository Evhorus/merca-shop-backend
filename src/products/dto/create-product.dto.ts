import { Optional } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsUUID,
  ValidateNested,
  IsOptional,
  IsBoolean,
  IsEnum,
  MinLength,
  MaxLength,
  NotContains,
  Matches,
  IsArray,
} from 'class-validator';

export class ProductFeatureDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export enum Unit {
  cm = 'cm',
  in = 'in',
  mm = 'mm',
  m = 'm',
}

export class ProductDimensionsDto {
  @IsString()
  @IsNotEmpty()
  length: string;

  @IsString()
  @IsNotEmpty()
  width: string;

  @IsString()
  @IsNotEmpty()
  height: string;

  @IsString()
  @IsOptional()
  depth?: string;

  @IsString()
  @IsOptional()
  diameter?: string;

  @IsEnum(Unit)
  unit: Unit;
}

export class ProductVariantColorDto {
  @IsString()
  @IsNotEmpty()
  colorCode: string;

  @IsString()
  @IsNotEmpty()
  colorName: string;
}

export class ProductVariantDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsInt()
  @Min(0)
  @Transform(({ value }) => Number(value))
  availableQuantity: number;

  // Using string to represent Decimal; in JS/TS no native decimal type
  @IsString()
  price: string;

  @IsString()
  colorName: string;

  @IsOptional()
  @Transform(({ value }) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    value ? (Array.isArray(value) ? value : [value]) : [],
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNotEmpty()
  @Matches(/^\S+(?: \S+)*$/, {
    message:
      'Description must be normalized: no leading or trailing spaces, and no consecutive spaces',
  })
  description: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug only allows lowercase letters, numbers and hyphens.',
  })
  @MinLength(3)
  @MaxLength(50)
  @NotContains(' ', { message: 'Slug should NOT contain whitespace.' })
  slug: string;

  @IsString()
  price: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive: boolean;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @Transform(({ value }) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    value ? (Array.isArray(value) ? value : [value]) : [],
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ValidateNested()
  @Type(() => ProductDimensionsDto)
  @IsOptional()
  dimensions?: ProductDimensionsDto;

  @ValidateNested({ each: true })
  @Type(() => ProductFeatureDto)
  @Optional()
  features?: ProductFeatureDto[];

  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @Optional()
  variants: ProductVariantDto[];
}
