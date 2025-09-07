import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { role } from 'src/roles.enum';
import { AuthGuard } from 'src/Auth/Auth.guard';
import { RolesGuard } from 'src/Auth/roles.guard';

@Controller('file')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('uploadImage/:productId')
  @ApiBearerAuth()
  @Roles(role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 50000000,
            message: 'File is too large',
          }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.fileUploadService.uploadImage(file, productId);
  }

  @Post('UploadProfile/:userId')
  @UseInterceptors(FileInterceptor('file'))
  uploadImageProfile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 50000000,
            message: 'File is too large',
          }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.fileUploadService.uploadProfileUser(file, userId);
  }
}
