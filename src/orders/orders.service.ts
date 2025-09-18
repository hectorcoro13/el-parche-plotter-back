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
import { MailerService } from '@nestjs-modules/mailer';
import { CartService } from 'src/cart/cart.services'; // <-- IMPORTANTE
import { PdfService } from 'src/pdf/pdf.service'; // <-- IMPORTANTE
import { format } from 'date-fns'; // <-- IMPORTANTE

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Orders)
    private readonly orderRepository: Repository<Orders>,
    @InjectRepository(OrderDetails)
    private readonly orderDetailRepository: Repository<OrderDetails>,
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
    private readonly mailerService: MailerService,
    private readonly cartService: CartService, // <-- INYECTAR
    private readonly pdfService: PdfService, // <-- INYECTAR
  ) {}

  async create(createOrderDto: CreateOrderDto, paymentId: string) {
    // <-- AÑADIMOS paymentId
    const user = await this.usersRepository.findOneBy({
      id: createOrderDto.userId,
    });
    if (!user) {
      throw new NotFoundException('Usuario incorrecto');
    }

    const existingOrder = await this.orderRepository.findOne({
      where: { paymentId },
    });
    if (existingOrder) {
      console.log(
        `> La orden para el pago ${paymentId} ya existe. Omitiendo acciones.`,
      );
      // Si la orden ya existe, la devolvemos sin hacer nada más
      return this.orderRepository.find({
        where: { id: existingOrder.id },
        relations: ['orderDetails.products'],
      });
    }

    const order = new Orders();
    order.user = user;
    order.paymentId = paymentId; // Guardamos el ID del pago
    const newOrder = await this.orderRepository.save(order);

    let total = 0;
    const productsArray: Products[] = await Promise.all(
      createOrderDto.products.map(async (element) => {
        const product = await this.productsRepository.findOneBy({
          id: element?.id,
        });
        if (!product) throw new NotFoundException('Producto no encontrado');
        if (product.stock < 1)
          throw new BadRequestException(
            `El producto "${product.name}" no tiene stock.`,
          );
        total += Number(product.price);
        await this.productsRepository.decrement({ id: product.id }, 'stock', 1);
        return product;
      }),
    );

    const orderDetail = new OrderDetails();
    orderDetail.order = newOrder;
    orderDetail.price = Number(total.toFixed(2));
    orderDetail.products = productsArray;
    await this.orderDetailRepository.save(orderDetail);

    // LÓGICA POST-PAGO AHORA CENTRALIZADA AQUÍ
    await this.cartService.clearCart(createOrderDto.userId);
    console.log(`> Carrito del usuario ${createOrderDto.userId} vaciado.`);

    const orderDetailsForTemplate = productsArray.map((product) => ({
      name: product.name,
      quantity: 1,
      price: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
      }).format(Number(product.price)),
    }));
    const totalFormatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(total);

    const templateData = {
      name: user.name,
      orderId: newOrder.id.split('-')[0].toUpperCase(),
      date: format(newOrder.date, 'dd/MM/yyyy'),
      paymentId: paymentId,
      products: orderDetailsForTemplate,
      total: totalFormatted,
      year: new Date().getFullYear(),
    };

    const pdfBuffer = await this.pdfService.generateInvoice(templateData);

    await this.mailerService.sendMail({
      to: user.email,
      subject: `✅ Confirmación de tu compra #${templateData.orderId} en El Parche Plotter`,
      template: 'order-confirmation',
      context: templateData,
      attachments: [
        {
          filename: `factura-${templateData.orderId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    console.log(
      `> Email de confirmación con factura PDF enviado a ${user.email}.`,
    );

    return this.orderRepository.find({
      where: { id: newOrder.id },
      relations: { orderDetails: { products: true } },
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
