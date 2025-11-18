import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
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
