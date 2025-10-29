import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma';

import { ColorsService } from './colors.service';
import { ColorsController } from './colors.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ColorsController],
  providers: [ColorsService],
  exports: [ColorsService],
})
export class ColorsModule {}
