import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  NotContains,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug only allows lowercase letters, numbers and hyphens.',
  })
  @MinLength(3)
  @MaxLength(50)
  @NotContains(' ', { message: 'Slug should NOT contain whitespace.' })
  slug: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive: boolean;
}
