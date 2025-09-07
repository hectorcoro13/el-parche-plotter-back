import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderDetails } from 'src/orders/entities/orderDetails.entity';
import { Products } from 'src/Products/entities/products.entity';
import { Users } from 'src/Users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Users) private usersRepository: Repository<Users>,
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
    @InjectRepository(OrderDetails)
    private orderDetailsRepository: Repository<OrderDetails>,
  ) {}

  async getStats() {
    const totalUsers = await this.usersRepository.count();
    const totalProducts = await this.productsRepository.count();
    const allOrders = await this.orderDetailsRepository.find();

    const totalRevenue = allOrders.reduce(
      (sum, order) => sum + Number(order.price),
      0,
    );
    const totalSales = allOrders.length;

    return { totalUsers, totalProducts, totalRevenue, totalSales };
  }
}
