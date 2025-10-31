import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { FilesModule } from './files/files.module';
import { CommonModule } from './common/common.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { ColorsModule } from './colors/colors.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthCheckModule } from './health-check/health-check.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HealthCheckModule,
    AuthModule,
    PrismaModule,
    CloudinaryModule,
    FilesModule,
    CommonModule,
    CategoriesModule,
    ProductsModule,
    ColorsModule,
  ],
})
export class AppModule {}
