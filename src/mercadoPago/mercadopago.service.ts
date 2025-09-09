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

  async createPreference(items: any[], user: any) {
    try {
      const preferenceBody = {
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          currency_id: 'COP',
        })),
        // --- AÑADE ESTE BLOQUE 'payer' ---
        payer: {
          email: user.email,
          name: user.name,
        },
        // --- FIN DEL BLOQUE AÑADIDO ---
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
      throw new BadRequestException(
        'No se pudo crear la preferencia de pago con MercadoPago.',
      );
    }
  }

  async processPayment(paymentData: any) {
    console.log('\n--- [MercadoPago] Procesando Pago ---');
    console.log('1. Datos del pago recibidos del frontend (parcial):', {
      transaction_amount: paymentData.transaction_amount,
      token_presente: !!paymentData.token,
      description: paymentData.description,
      installments: paymentData.installments,
      payment_method_id: paymentData.payment_method_id,
      payer_email: paymentData.payer?.email,
    });

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
      console.log(
        '2. Respuesta de MercadoPago al procesar el pago:',
        JSON.stringify(result, null, 2),
      );
      console.log('-------------------------------------------\n');

      return result;
    } catch (error) {
      console.error('--- [MercadoPago] ERROR al procesar el pago ---');
      // El objeto 'error.cause' a menudo contiene la respuesta JSON completa de la API de MercadoPago
      console.error(
        'Causa del Error (Respuesta de MP):',
        JSON.stringify(error.cause, null, 2),
      );
      console.error('-------------------------------------------\n');
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
