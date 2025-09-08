import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Products } from './entities/products.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Categories } from 'src/categories/entities/category.entity';
import * as Archivoactividad3 from '../Archivoactividad3.json';
import { Orders } from 'src/orders/entities/order.entity';
import { UpdateProductDto } from './Dto/update-product.dto';
import { CreateProductDto } from './Dto/create-product.dto';

@Injectable()
export class ProductsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductsService.name);
  constructor(
    @InjectRepository(Products)
    private readonly ProductsRepository: Repository<Products>,
    @InjectRepository(Categories)
    private readonly CategoriesRepository: Repository<Categories>,
    @InjectRepository(Orders)
    private readonly OrdersRepository: Repository<Orders>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('estas ejecutando seeder automatico');
    try {
      await this.resetseeder();
      this.logger.log('seeder completado');
    } catch (error) {
      this.logger.warn(`seeder automatico cancelado: ${error.message}`);
    }
  }
  async resetseeder({ force = false }: { force?: boolean } = {}) {
    const countOrders = await this.OrdersRepository.count();
    if (countOrders > 0 && !force) {
      throw new BadRequestException(
        `Hay ${countOrders} órdenes activas. Usa force=true para forzar el reset.`,
      );
    }

    const categories: Categories[] = await this.CategoriesRepository.find();

    const newProducts: Products[] = Archivoactividad3.map((element) => {
      const category: Categories | undefined = categories.find(
        (category) => element.category === category.name,
      );
      const newProduct = new Products();
      newProduct.name = element.name;
      newProduct.description = element.description;
      newProduct.price = element.price;
      newProduct.stock = element.stock;
      newProduct.category = category!;

      return newProduct;
    });
    await this.ProductsRepository.upsert(newProducts, ['name']);
    return 'Products Added';
  }

  async getProducts(page: number = 1, limit: number = 6) {
    const allProducts: Products[] = await this.ProductsRepository.find({
      relations: {
        category: true,
      },
    });

    const start = (page - 1) * limit;
    const end = start + limit;
    return allProducts.slice(start, end);
  }

  async getFeaturedProducts(): Promise<Products[]> {
    const allProducts = await this.ProductsRepository.find({
      order: { name: 'ASC' }, // O cualquier otro campo para un orden consistente
    });

    if (allProducts.length <= 3) {
      return allProducts;
    }

    const first = allProducts[0];
    const middleIndex = Math.floor((allProducts.length - 1) / 2);
    const middle = allProducts[middleIndex];
    const last = allProducts[allProducts.length - 1];

    // Nos aseguramos de no devolver duplicados si los índices coinciden
    const featured = [first, middle, last];
    return [...new Set(featured)];
  }

  async create(createProductDto: CreateProductDto) {
    const category = await this.CategoriesRepository.findOneBy({
      id: createProductDto.categoryId,
    });
    if (!category) throw new NotFoundException('Category not found');

    const newProduct = this.ProductsRepository.create({
      ...createProductDto,
      category,
    });
    return await this.ProductsRepository.save(newProduct);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.ProductsRepository.findOneBy({ id });
    if (!product) throw new NotFoundException('Product not found');

    const updatedProduct = this.ProductsRepository.merge(
      product,
      updateProductDto,
    );
    return await this.ProductsRepository.save(updatedProduct);
  }

  async remove(id: string) {
    const product = await this.ProductsRepository.findOneBy({ id });
    if (!product) throw new NotFoundException('Product not found');

    await this.ProductsRepository.remove(product);
    return { message: `Product with id ${id} successfully deleted` };
  }
}
