import { IsString, IsNotEmpty } from 'class-validator';

export class CreateColorDto {
  @IsString()
  @IsNotEmpty()
  colorCode: string;

  @IsString()
  @IsNotEmpty()
  colorName: string;
}
