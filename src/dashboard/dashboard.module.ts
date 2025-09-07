import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/Users/entities/user.entity';
import { Products } from 'src/Products/entities/products.entity';
import { OrderDetails } from 'src/orders/entities/orderDetails.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, Products, OrderDetails])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
