import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { MailerService } from '@nestjs-modules/mailer';
import { Repository } from 'typeorm';
import { Users } from 'src/Users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

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
    console.log('--- [MERCADOPAGO] INICIANDO LA CREACIÓN DE PREFERENCIA ---');
    console.log(`> User ID recibido: ${user.id}`);
    console.log('> Items recibidos:', JSON.stringify(items, null, 2));

    try {
      console.log(
        '--- [MERCADOPAGO] Buscando datos completos del usuario en la BD...',
      );
      const fullName = user.name || '';

      // 2. Dividimos el nombre y apellido de forma segura.
      const nameParts = fullName.split(' ');
      const name = nameParts.slice(0, 1).join(''); // Solo el primer nombre
      const lastname = nameParts.slice(1).join(' '); // El resto es el apellido

      // 3. Validamos que tengamos al menos un nombre.
      if (!name) {
        console.error(
          '--- [MERCADOPAGO] ERROR: El nombre del usuario está vacío.',
        );
        throw new BadRequestException(
          'El nombre del usuario es requerido para el pago.',
        );
      }
      const fullUser = await this.usersRepository.findOneBy({ id: user.id });
      if (!fullUser) {
        console.error(
          `--- [MERCADOPAGO] ERROR: Usuario con ID ${user.id} no fue encontrado.`,
        );
        throw new NotFoundException('Usuario para el pago no encontrado.');
      }

      // LOG #1: DATOS COMPLETOS DEL USUARIO
      console.log(
        '--- [MERCADOPAGO] Datos del usuario encontrados en la BD: ---',
      );
      console.log(JSON.stringify(fullUser, null, 2));

      // LOG #2: VALIDACIÓN MANUAL DE DATOS CLAVE
      console.log('--- [MERCADOPAGO] Validando datos del "payer"...');
      if (
        !fullUser.name ||
        !fullUser.email ||
        !fullUser.phone ||
        !fullUser.identificationType ||
        !fullUser.identificationNumber
      ) {
        console.error(
          '--- [MERCADOPAGO] ERROR CRÍTICO: Faltan datos obligatorios del usuario (nombre, email, teléfono, identificación).',
        );
        throw new BadRequestException(
          'Faltan datos del usuario para procesar el pago.',
        );
      }
      console.log('> Todos los datos del "payer" requeridos están presentes.');

      const preferenceBody = {
        items: items.map((item) => ({
          id: item.id,
          title: item.name,
          quantity: item.quantity,
          unit_price: Number(item.price),
          currency_id: 'COP',
        })),
        payer: {
          name: name,
          surname: lastname,
          email: fullUser.email,
          phone: {
            area_code: '57',
            number: String(fullUser.phone),
          },
          identification: {
            type: String(fullUser.identificationType),
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
        auto_return: 'approved' as const,
        notification_url: `${process.env.BACKEND_URL}/mercadopago/webhook`,
        external_reference: fullUser.id,
      };

      // LOG #3: CUERPO DE LA PREFERENCIA (EL MÁS IMPORTANTE)
      console.log(
        '--- [MERCADOPAGO] Objeto `preferenceBody` que se enviará a Mercado Pago: ---',
      );
      console.log(JSON.stringify(preferenceBody, null, 2));

      const preference = new Preference(this.client);
      console.log(
        '--- [MERCADOPAGO] Enviando petición a la API de Mercado Pago...',
      );
      const result = await preference.create({ body: preferenceBody });

      console.log(
        `--- [MERCADOPAGO] ¡Preferencia creada exitosamente! Preference ID: ${result.id} ---`,
      );
      return result.id;
    } catch (error) {
      console.error(
        '--- [MERCADOPAGO] ¡ERROR CRÍTICO AL CREAR LA PREFERENCIA! ---',
      );

      // LOG #4: CAUSA DETALLADA DEL ERROR (ESTO APARECE EN TU CAPTURA)
      console.error('--- Causa detallada del error (error.cause): ---');
      console.error(JSON.stringify(error.cause, null, 2));

      console.error('--- Objeto de error COMPLETO capturado: ---');
      console.error(error);

      throw new BadRequestException(
        'No se pudo crear la preferencia de pago con MercadoPago.',
      );
    }
  }

  // --- FUNCIÓN DE WEBHOOK MEJORADA CON LOGS DETALLADOS ---
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

      if (payment.status === 'approved') {
        console.log(
          `--- [WEBHOOK] ¡Pago Aprobado! Procesando orden para: ${payment.payer?.email}`,
        );
        // Aquí iría tu lógica para crear la orden, vaciar el carrito, etc.
        const userEmail = payment.payer?.email;
        if (userEmail) {
          await this.mailService.sendMail({
            to: userEmail,
            subject: 'Confirmación de tu pedido en El Parche Plotter',
            html: `<p>¡Gracias por tu compra! Tu pago con ID ${payment.id} ha sido aprobado.</p>`,
          });
          console.log(
            `--- [WEBHOOK] Email de confirmación enviado a ${userEmail}`,
          );
        }
      } else if (payment.status === 'rejected') {
        console.error(`--- [WEBHOOK] ¡PAGO RECHAZADO! ---`);
        console.error(
          `> Motivo del rechazo (status_detail): ${payment.status_detail}`,
        );
      } else {
        console.warn(
          `--- [WEBHOOK] Pago recibido con estado no manejado: ${payment.status} (${payment.status_detail}) ---`,
        );
      }
    } catch (error) {
      console.error(
        '--- [WEBHOOK] ERROR al manejar la notificación de pago: ---',
      );
      console.error(JSON.stringify(error.cause, null, 2));
      throw new InternalServerErrorException(
        'Error al procesar la notificación de Mercado Pago',
      );
    }
  }
}
