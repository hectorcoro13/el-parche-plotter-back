import { BadRequestException, Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MercadoPagoService {
  constructor(private readonly mailService: MailerService) {}

  // 2. Crea una instancia del cliente con tu Access Token
  private readonly client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  });

  async createPreference(items: any[]) {
    try {
      const preferenceBody = {
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          currency_id: 'COP',
        })),
        back_urls: {
          success: 'https://elparcheplotter.studio/perfil',
          failure: 'https://elparcheplotter.studio/carrito',
          pending: 'https://elparcheplotter.studio/perfil',
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/mercadopago/webhook`,
      };

      const preference = new Preference(this.client);
      const result = await preference.create({ body: preferenceBody });
      return result.id;
    } catch (error) {
      console.error('Error creating preference in MercadoPago:', error);
      // Aseguramos que el error sea claro si algo falla.
      throw new BadRequestException(
        'No se pudo crear la preferencia de pago con MercadoPago.',
      );
    }
  }
  // ... el resto de los métodos (processPayment, handlePaymentNotification) permanecen igual ...
  async processPayment(paymentData: any) {
    try {
      const paymentClient = new Payment(this.client);
      const idempotencyKey = Math.random().toString(36).substring(7);

      const result = await paymentClient.create({
        body: {
          transaction_amount: paymentData.transaction_amount,
          token: paymentData.token,
          description: paymentData.description,
          installments: paymentData.installments,
          payment_method_id: paymentData.payment_method_id,
          payer: {
            email: paymentData.payer.email,
          },
        },
        requestOptions: {
          idempotencyKey: idempotencyKey,
        },
      });
      return result;
    } catch (error) {
      console.error('Error processing payment:', error.cause ?? error.message);
      throw new BadRequestException('El pago no pudo ser procesado.');
    }
  }

  async handlePaymentNotification(paymentId: string) {
    try {
      const paymentClient = new Payment(this.client);
      const payment = await paymentClient.get({ id: paymentId });

      console.log('Payment details:', payment);

      if (payment.status === 'approved') {
        console.log(`Payment ${paymentId} was approved!`);

        const userEmail = payment.payer?.email;
        if (userEmail) {
          await this.mailService.sendMail({
            to: userEmail,
            subject: 'Order Confirmation',
            html: `<p>Thank you for your order! Your payment with ID ${payment.id} has been approved.</p>`,
            context: { payment },
          });
        }
      }
    } catch (error) {
      console.error('Error handling payment notification:', error);
    }
  }
}
