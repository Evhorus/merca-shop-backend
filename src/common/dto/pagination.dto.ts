import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number) // enableImplicitConversions: true
  limit?: number;

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  gender?: 'men' | 'women' | 'unisex' | 'kid' | '';

  @IsOptional()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @Type(() => String)
  sizes?: string;

  @IsOptional()
  @Type(() => String)
  q?: string;
}
