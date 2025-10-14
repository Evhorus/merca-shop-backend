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
  @Matches(/^\S+(?: \S+)*$/, {
    message:
      'Name must be normalized: no leading or trailing spaces, and no consecutive spaces',
  })
  name: string;

  @IsString()
  @IsOptional()
  @Matches(/^\S+(?: \S+)*$/, {
    message:
      'Description must be normalized: no leading or trailing spaces, and no consecutive spaces',
  })
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
  images?: string[];

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive: boolean;
}
