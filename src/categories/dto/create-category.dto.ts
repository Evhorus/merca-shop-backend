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
  IsUUID,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Matches(/^\S+(?: \S+)*$/, {
    message:
      'Name must be normalized: no leading or trailing spaces, and no consecutive spaces',
  })
  name: string;

  @IsString()
  @Matches(/^\S+(?: \S+)*$/, {
    message:
      'Description must be normalized: no leading or trailing spaces, and no consecutive spaces',
  })
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

  @IsOptional()
  @Transform(({ value }) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    value ? (Array.isArray(value) ? value : [value]) : [],
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive: boolean;

  @IsUUID()
  @IsOptional()
  parentId?: string | null; // Solo permite 2 niveles: Categoría raíz → Categoría hija
}
