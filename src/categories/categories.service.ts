import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { FilesService } from 'src/files/files.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    files: Express.Multer.File[],
  ) {
    const categoryExist = await this.prisma.category.findFirst({
      where: { name: createCategoryDto.name },
    });

    if (categoryExist) {
      throw new BadRequestException(
        `Category with name ${createCategoryDto.name} already exist`,
      );
    }

    const category = await this.prisma.$transaction(async (transaction) => {
      const createdCategory = await transaction.category.create({
        data: {
          name: createCategoryDto.name,
          description: createCategoryDto.description,
          isActive: createCategoryDto.isActive,
          slug: createCategoryDto.slug,
        },
        include: { images: true },
      });

      const images = await this.filesService.uploadImages(
        files,
        `categories/${createdCategory.id}`,
      );

      await Promise.all(
        images.fileNames.map((image) => {
          return transaction.categoryImage.create({
            data: {
              categoryId: createdCategory.id,
              image: image,
            },
          });
        }),
      );

      return {
        ...createdCategory,
        images: images.fileNames.map((image) => ({ image })),
      };
    });

    return { ...category, images: category.images.map((img) => img.image) };
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const categories = await this.prisma.category.findMany({
      take: limit,
      skip: offset,
      include: { images: true },
      orderBy: { id: 'asc' },
    });

    const totalCategories = await this.prisma.category.count({
      where: {},
    });

    return {
      count: totalCategories,
      pages: Math.ceil(totalCategories / limit),
      categories: categories.map((category) => ({
        ...category,
        images: category.images.map((img) => img.image),
      })),
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
      include: { images: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return { ...category, images: category.images.map((img) => img.image) };
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    files: Array<Express.Multer.File>,
  ) {
    await this.findOne(id);

    const updatedCategory = await this.prisma.$transaction(
      async (transaction) => {
        const createdCategory = await transaction.category.update({
          where: { id },
          data: {
            name: updateCategoryDto.name,
            description: updateCategoryDto.description,
            isActive: updateCategoryDto.isActive,
            slug: updateCategoryDto.slug,
          },
        });

        let imagesNames: string[] = updateCategoryDto.images || [];

        if (files.length > 0) {
          const images = await this.filesService.uploadImages(
            files,
            `categories/${createdCategory.id}`,
          );
          imagesNames.push(...images.fileNames);
        }

        imagesNames = Array.from(new Set(imagesNames));

        if (imagesNames.length > 0) {
          await transaction.categoryImage.deleteMany({
            where: { categoryId: id },
          });
          await Promise.all(
            imagesNames.map((image) => {
              return transaction.categoryImage.create({
                data: {
                  categoryId: createdCategory.id,
                  image: image,
                },
              });
            }),
          );
        }

        return {
          ...createdCategory,
          images: imagesNames,
        };
      },
    );

    return updatedCategory;
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    await this.prisma.category.delete({ where: { id } });
    await this.cloudinary.deleteImagesByFolder(`categories/${category.id}`);

    return {
      message: 'category deleted',
    };
  }
}
