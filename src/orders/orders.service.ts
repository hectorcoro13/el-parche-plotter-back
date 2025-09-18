import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Orders } from './entities/order.entity';
import { Repository } from 'typeorm';
import { Users } from 'src/Users/entities/user.entity';
import { OrderDetails } from './entities/orderDetails.entity';
import { Products } from 'src/Products/entities/products.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Users)
    private readonly UsersRepository: Repository<Users>,
    @InjectRepository(Orders)
    private orderRepository: Repository<Orders>,
    @InjectRepository(OrderDetails)
    private OrderDetailRepository: Repository<OrderDetails>,
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const user: Users | null = await this.UsersRepository.findOneBy({
      id: createOrderDto.userId,
    });
    if (!user) {
      throw new NotFoundException('Incorrect user');
    }
    const order = new Orders();
    order.user = user;
    order.date = new Date();

    const newOrder = await this.orderRepository.save(order);

    let total = 0;

    const productsArray: Products[] = await Promise.all(
      createOrderDto.products.map(async (element) => {
        const product: Products | null =
          await this.productsRepository.findOneBy({
            id: element?.id,
          });

        if (!product) {
          throw new NotFoundException('Product not found');
        }
        if (product.stock < 1) {
          throw new BadRequestException(
            `El producto "${product.name}" ya no está disponible en stock.`,
          );
        }

        total += Number(product.price);

        await this.productsRepository.update(
          { id: product.id },
          { stock: product.stock - 1 },
        );
        return product;
      }),
    );
    const orderDetail = new OrderDetails();
    orderDetail.order = newOrder;
    orderDetail.price = Number(total.toFixed(2));
    orderDetail.products = productsArray;

    await this.OrderDetailRepository.save(orderDetail);

    return await this.orderRepository.find({
      where: { id: newOrder.id },
      relations: {
        orderDetails: true,
      },
    });
  }

  async findOne(id: string) {
    const order: Orders | null = await this.orderRepository.findOne({
      where: { id },
      relations: {
        orderDetails: {
          products: true,
        },
      },
    });
    if (!order) {
      throw new NotFoundException('order not found');
    }
    return order;
  }
  async findAll() {
    return await this.orderRepository.find({
      relations: {
        user: true,
        orderDetails: {
          products: true,
        },
      },
      order: {
        date: 'DESC', // Ordenar por fecha, las más recientes primero
      },
    });
  }
}
