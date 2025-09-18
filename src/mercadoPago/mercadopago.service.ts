import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from 'src/Users/entities/user.entity';
import { OrdersService } from 'src/orders/orders.service';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';

@Injectable()
export class MercadoPagoService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly ordersService: OrdersService, // Solo necesita el servicio de órdenes
  ) {}

  private readonly client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  });

  async createPreference(items: any[], user: any) {
    const fullUser = await this.usersRepository.findOneBy({ id: user.id });
    if (!fullUser) {
      throw new NotFoundException('Usuario para el pago no encontrado.');
    }

    const preference = new Preference(this.client);
    const result = await preference.create({
      body: {
        items: items.map((item) => ({
          id: item.id,
          title: item.name,
          quantity: item.quantity,
          unit_price: Number(item.price),
          currency_id: 'COP',
        })),
        payer: { email: fullUser.email },
        back_urls: {
          success: 'https://elparcheplotter.studio/perfil',
          failure: 'https://elparcheplotter.studio/carrito',
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/mercadopago/webhook`,
        external_reference: user.id,
      },
    });
    return { preferenceId: result.id };
  }

  async createPaymentFromBrick(paymentData: any, user: any) {
    const { formData, orderData } = paymentData;
    const paymentClient = new Payment(this.client);
    const payment = await paymentClient.create({ body: formData });

    if (payment.status === 'approved') {
      console.log(
        `--- [PAGO DIRECTO] Aprobado. Delegando creación de orden para pago ID: ${payment.id}`,
      );

      const createOrderDto: CreateOrderDto = {
        userId: user.id,
        products: orderData.products,
      };

      // Delegamos TODA la lógica al OrdersService
      await this.ordersService.create(createOrderDto, String(payment.id));

      return {
        success: true,
        message: 'Pago aprobado y orden procesada.',
        paymentId: payment.id,
      };
    } else {
      throw new BadRequestException(
        `El pago fue rechazado: ${payment.status_detail}`,
      );
    }
  }

  async handlePaymentNotification(paymentId: string) {
    const paymentClient = new Payment(this.client);
    const payment = await paymentClient.get({ id: paymentId });

    if (payment.status === 'approved') {
      const userId = payment.external_reference;
      if (userId) {
        console.log(
          `--- [WEBHOOK] Pago Aprobado. Delegando creación de orden para pago ID: ${paymentId}`,
        );
        const orderData = { products: [] }; // simplificación
        const createOrderDto: CreateOrderDto = {
          userId,
          products: orderData.products,
        };
        await this.ordersService.create(createOrderDto, paymentId);
      }
    }
  }
}
