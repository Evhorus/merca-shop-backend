import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [AuthModule, PrismaModule, CloudinaryModule, FilesModule],
})
export class AppModule {}
