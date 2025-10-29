import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from 'generated/prisma';

import { PrismaService } from 'src/prisma';
import { CreateColorDto, UpdateColorDto } from './dto';

@Injectable()
export class ColorsService {
  private readonly logger = new Logger(ColorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createColorDto: CreateColorDto) {
    const colorExists = await this.prisma.color.findFirst({
      where: {
        OR: [
          { colorCode: createColorDto.colorCode },
          { colorName: createColorDto.colorName },
        ],
      },
    });

    if (colorExists) {
      throw new ConflictException('Color already exists');
    }

    return this.prisma.color.create({ data: createColorDto });
  }

  findAll() {
    return this.prisma.color.findMany();
  }

  async findOne(where: Prisma.ColorWhereInput) {
    const color = await this.prisma.color.findFirst({
      where,
    });

    if (!color) {
      throw new NotFoundException('Color not found');
    }

    return color;
  }

  // !TODO
  update(id: number, updateColorDto: UpdateColorDto) {
    return `This action updates a #${id} color`;
  }

  // !TODO
  remove(id: number) {
    return `This action removes a #${id} color`;
  }
}
