import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from 'src/Users/entities/user.entity';
import { Orders } from 'src/orders/entities/order.entity';
import { OrdersService } from 'src/orders/orders.service';
import { CartService } from 'src/cart/cart.services';
import { MailerService } from '@nestjs-modules/mailer';
import * as crypto from 'crypto';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';
import { PdfService } from 'src/pdf/pdf.service';
import { format } from 'date-fns';

@Injectable()
export class MercadoPagoService {
  constructor(
    private readonly mailService: MailerService,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Orders)
    private readonly ordersRepository: Repository<Orders>,
    private readonly ordersService: OrdersService,
    private readonly cartService: CartService,
    private readonly pdfService: PdfService,
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
        `--- [PAGO DIRECTO] Aprobado. Procesando orden para pago ID: ${payment.id}`,
      );
      await this.processSuccessfulPayment(
        String(payment.id),
        orderData,
        user.id,
      );
      return {
        success: true,
        message: 'Pago aprobado y orden creada.',
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
          `--- [WEBHOOK] Pago Aprobado. Procesando orden para pago ID: ${paymentId}`,
        );
        const orderData = { products: [] };
        await this.processSuccessfulPayment(
          String(payment.id),
          orderData,
          userId,
        );
      }
    }
  }

  private async processSuccessfulPayment(
    paymentId: string,
    orderData: any,
    userId: string,
  ) {
    const existingOrder = await this.ordersRepository.findOne({
      where: { paymentId },
    });
    if (existingOrder) {
      console.log(
        `> La orden para el pago ${paymentId} ya existe. Omitiendo acciones.`,
      );
      return;
    }

    console.log(`> Procesando nueva orden para el pago ${paymentId}...`);
    const createOrderDto: CreateOrderDto = {
      userId,
      products: orderData.products,
    };
    const newOrderArray = await this.ordersService.create(createOrderDto);
    const newOrder = newOrderArray[0];
    newOrder.paymentId = paymentId;
    await this.ordersRepository.save(newOrder);
    console.log(`> Orden ${newOrder.id} creada y stock actualizado.`);

    await this.cartService.clearCart(userId);
    console.log(`> Carrito del usuario ${userId} vaciado.`);

    // --- LA CORRECCIÓN ESTÁ AQUÍ ---
    // Tu `OrdersService.create` devuelve la orden con `orderDetails` que es un array.
    // Dentro de cada `orderDetail` hay un array de `products`.
    const orderDetailsForTemplate = newOrder.orderDetails[0].products.map(
      (product) => ({
        name: product.name,
        quantity: 1, // Asumiendo cantidad 1
        price: new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
        }).format(Number(product.price)),
      }),
    );
    const totalFormatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(Number(newOrder.orderDetails[0].price));

    const fullUser = await this.usersRepository.findOneBy({ id: userId });
    if (fullUser) {
      const templateData = {
        name: fullUser.name,
        orderId: newOrder.id.split('-')[0].toUpperCase(),
        date: format(newOrder.date, 'dd/MM/yyyy'),
        paymentId: paymentId,
        products: orderDetailsForTemplate,
        total: totalFormatted,
        year: new Date().getFullYear(),
      };

      const pdfBuffer = await this.pdfService.generateInvoice(templateData);

      await this.mailService.sendMail({
        to: fullUser.email,
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
        `> Email de confirmación con factura PDF enviado a ${fullUser.email}.`,
      );
    }
  }

  validateWebhookSignature(
    signature: string,
    requestId: string,
    paymentId: string,
  ): boolean {
    try {
      const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
      if (!secret)
        throw new Error('El secreto del webhook no está configurado.');

      const parts = signature.split(',');
      const timestamp = parts
        .find((part) => part.startsWith('ts='))
        ?.split('=')[1];
      const receivedHash = parts
        .find((part) => part.startsWith('v1='))
        ?.split('=')[1];

      if (!timestamp || !receivedHash) return false;

      const manifest = `id:${paymentId};request-id:${requestId};ts:${timestamp};`;
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(manifest);
      const calculatedHash = hmac.digest('hex');

      return calculatedHash === receivedHash;
    } catch (error) {
      console.error('Error validando la firma del webhook:', error);
      return false;
    }
  }
}
