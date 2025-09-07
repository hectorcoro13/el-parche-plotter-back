import { Module } from '@nestjs/common';
import { CartService } from './cart.services';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Users } from 'src/Users/entities/user.entity';
import { Products } from 'src/Products/entities/products.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, Users, Products])],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
