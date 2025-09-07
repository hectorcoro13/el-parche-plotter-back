import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { CloudinaryConfig } from 'src/config/cloudinary';
import { fileUploadRepository } from './file-upload.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Products } from 'src/Products/entities/products.entity';
import { Users } from 'src/Users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Products, Users])],
  controllers: [FileUploadController],
  providers: [FileUploadService, CloudinaryConfig, fileUploadRepository],
})
export class FileUploadModule {}
