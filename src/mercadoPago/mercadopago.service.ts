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
import { UsersService } from 'src/Users/users.service';

@Injectable()
export class MercadoPagoService {
  constructor(
    private readonly mailService: MailerService,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly usersService: UsersService,
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

      const preference = new Preference(this.client);
      const result = await preference.create({ body: preferenceBody });
      return result.id;
    } catch (error) {
      console.error('--- ¡ERROR AL CREAR LA PREFERENCIA EN MERCADOPAGO! ---');
      console.error(
        'Causa detallada del error (error.cause):',
        JSON.stringify(error.cause, null, 2),
      );
      console.error('Objeto de error COMPLETO capturado:', error);
      throw new BadRequestException(
        'No se pudo crear la preferencia de pago con MercadoPago.',
      );
    }
  }

  // --- FUNCIÓN MEJORADA CON LOGS DETALLADOS ---
  async handlePaymentNotification(paymentId: string) {
    console.log(
      `--- [WEBHOOK] Notificación recibida para el ID de pago: ${paymentId} ---`,
    );
    try {
      const paymentClient = new Payment(this.client);
      const payment = await paymentClient.get({ id: paymentId });

      // LOG CLAVE: Imprime el objeto de pago COMPLETO que recibimos del webhook.
      console.log(
        '--- [WEBHOOK] Objeto de pago completo recibido de Mercado Pago: ---',
      );
      console.log(JSON.stringify(payment, null, 2));

      // Aquí buscaremos el motivo del rechazo
      if (payment.status === 'rejected') {
        console.error(`--- [WEBHOOK] ¡PAGO RECHAZADO! ---`);
        console.error(
          `> Motivo del rechazo (status_detail): ${payment.status_detail}`,
        );
      }

      if (payment.status === 'approved') {
        console.log(`--- [WEBHOOK] ¡Pago Aprobado! Enviando email...`);
        const userEmail = payment.payer?.email;
        if (userEmail) {
          await this.mailService.sendMail({
            to: userEmail,
            subject: 'Confirmación de tu pedido en El Parche Plotter',
            html: `<p>¡Gracias por tu compra! Tu pago con ID ${payment.id} ha sido aprobado.</p>`,
          });
        }
      }
    } catch (error) {
      console.error(
        '--- [WEBHOOK] ERROR al manejar la notificación de pago: ---',
      );
      console.error(JSON.stringify(error.cause, null, 2));
    }
  }
}
