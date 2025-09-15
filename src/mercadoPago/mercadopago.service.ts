import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { MailerService } from '@nestjs-modules/mailer';
import { Repository } from 'typeorm/repository/Repository';
import { Users } from 'src/Users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';

@Injectable()
export class MercadoPagoService {
  constructor(
    private readonly mailService: MailerService,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  private readonly client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  });

  async createPreference(items: any[], user: any) {
    try {
      const fullUser = await this.usersRepository.findOneBy({ id: user.id });
      if (!fullUser) {
        throw new NotFoundException('Usuario para el pago no encontrado.');
      }

      const preferenceBody = {
        items: items.map((item) => ({
          id: item.id,
          title: item.name,
          quantity: item.quantity,
          unit_price: Number(item.price),
          currency_id: 'COP',
        })),
        payer: {
          name: fullUser.name,
          surname: '',
          email: fullUser.email,
          phone: {
            area_code: '57',
            number: String(fullUser.phone),
          },
          identification: {
            type: fullUser.identificationType,
            number: String(fullUser.identificationNumber),
          },
          address: {
            street_name: fullUser.address,
          },
        },
        back_urls: {
          success: 'https://elparcheplotter.studio/perfil',
          failure: 'https://elparcheplotter.studio/carrito',
          pending: 'https://elparcheplotter.studio/perfil',
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/mercadopago/webhook`,
      };

      // LOG #1: VER LO QUE ESTAMOS ENVIANDO A MERCADO PAGO
      console.log('--- Creando Preferencia con el siguiente cuerpo: ---');
      console.log(JSON.stringify(preferenceBody, null, 2));

      const preference = new Preference(this.client);
      const result = await preference.create({ body: preferenceBody });
      return result.id;
    } catch (error) {
      // LOG #2: ¡EL MÁS IMPORTANTE! CAPTURAR LA CAUSA DEL ERROR DE LA API
      console.error('--- ¡ERROR AL CREAR LA PREFERENCIA EN MERCADOPAGO! ---');
      // El objeto 'error.cause' contiene la respuesta detallada de la API de Mercado Pago
      console.error(
        'Causa detallada del error:',
        JSON.stringify(error.cause, null, 2),
      );

      throw new BadRequestException(
        'No se pudo crear la preferencia de pago con MercadoPago.',
      );
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
