import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { Public } from 'src/auth';
import { fileFilter } from 'src/files';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { ProductOptionsQueryDto } from './dto';

@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      fileFilter,
    }),
  )
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.productsService.create(createProductDto, files);
  }

  @Get()
  findAll(@Query() productOptionsQueryDto: ProductOptionsQueryDto) {
    return this.productsService.findAll(productOptionsQueryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne({
      where: { id },
    });
  }

  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      fileFilter,
    }),
  )
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.productsService.update(id, updateProductDto, files);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
