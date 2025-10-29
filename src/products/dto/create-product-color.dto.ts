import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProductVariantColorDto {
  @IsString()
  @IsNotEmpty()
  colorCode: string;

  @IsString()
  @IsNotEmpty()
  colorName: string;
}
