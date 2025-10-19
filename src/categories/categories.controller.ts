import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { Public } from 'src/auth/decorators/public.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { fileFilter } from 'src/files/helpers/file-filter';

import { CategoryOptionsQueryDto } from './dto/index';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      fileFilter,
    }),
  )
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.categoriesService.create(createCategoryDto, files);
  }

  @Public()
  @Get()
  findAll(@Query() CategoryOptionsQueryDto: CategoryOptionsQueryDto) {
    return this.categoriesService.findAll(CategoryOptionsQueryDto);
  }

  @Public()
  @Get(':id')
  findOne(
    @Query() categoryOptionsQueryDto: CategoryOptionsQueryDto,
    @Param('id') id: string,
  ) {
    return this.categoriesService.findOne({
      where: { id },
      withImages: categoryOptionsQueryDto.withImages,
      withProducts: categoryOptionsQueryDto.withProducts,
      withProductCount: categoryOptionsQueryDto.withProductCount,
    });
  }

  @Public()
  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      fileFilter,
    }),
  )
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, files);
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
