import { Injectable, NotFoundException } from '@nestjs/common';
import { fileUploadRepository } from './file-upload.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Products } from 'src/Products/entities/products.entity';
import { Repository } from 'typeorm';
import { Users } from 'src/Users/entities/user.entity';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly fileUploadrepository: fileUploadRepository,
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}
  async uploadImage(file: Express.Multer.File, productId: string) {
    const product = await this.productsRepository.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const uploadResponse = await this.fileUploadrepository.uploadImage(file);
    await this.productsRepository.update(product.id, {
      imgUrl: uploadResponse.secure_url,
    });
    return await this.productsRepository.findOneBy({ id: productId });
  }

  async uploadProfileUser(file: Express.Multer.File, userId: string) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uploadResponse = await this.fileUploadrepository.uploadImage(file);
    await this.usersRepository.update(user.id, {
      imageProfile: uploadResponse.secure_url,
    });
    return await this.usersRepository.findOneBy({ id: userId });
  }
}
