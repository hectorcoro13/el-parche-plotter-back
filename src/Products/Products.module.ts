import { Module } from '@nestjs/common';
import { ProductsService } from './Products.service';
import { ProductsController } from './Products.controller';
// import { ProductsRepository } from './Products.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categories } from 'src/categories/entities/category.entity';
import { Products } from './entities/products.entity';
import { Orders } from 'src/orders/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Categories, Products, Orders])],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
