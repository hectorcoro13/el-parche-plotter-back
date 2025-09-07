import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as Archivoactividad3 from '../Archivoactividad3.json';
import { InjectRepository } from '@nestjs/typeorm';
import { Categories } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CategoriesService.name);
  constructor(
    @InjectRepository(Categories)
    private readonly categoriesRepository: Repository<Categories>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('estas ejecutando seeder automatico');
    try {
      await this.seeder();
      this.logger.log('seeder completado');
    } catch (error) {
      this.logger.warn(`seeder automatico cancelado: ${error.message}`);
    }
  }
  async seeder() {
    const CategoriesName: Set<string> = new Set(
      Archivoactividad3.map((element) => element.category),
    );
    const CategoriesArray: string[] = Array.from(CategoriesName);
    const categories = CategoriesArray.map((category) => ({ name: category }));

    await this.categoriesRepository.upsert(categories, ['name']);

    return `This action returns all categories`;
  }
  async findAll() {
    return await this.categoriesRepository.find();
  }
}
