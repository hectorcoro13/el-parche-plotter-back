import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { AuthGuard } from 'src/Auth/Auth.guard';
import * as crypto from 'crypto';

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  @Post('create-preference')
  @UseGuards(AuthGuard)
  async createPreference(@Req() req, @Body() body: { items: any[] }) {
    const user = req.user;
    const preferenceId = await this.mercadoPagoService.createPreference(
      body.items,
      user,
    );
    return { preferenceId };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Body() notification: any,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
  ) {
    console.log(
      '--- [WEBHOOK] Petición entrante recibida en /mercadopago/webhook ---',
    );
    console.log('> Body recibido:', JSON.stringify(notification, null, 2));

    if (!signature) {
      console.error(
        '--- [WEBHOOK] RECHAZADO: Petición sin header x-signature.',
      );
      throw new BadRequestException('Firma de Webhook ausente.');
    }

    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) {
      console.error(
        '--- [WEBHOOK] ERROR FATAL: El secreto del webhook no está configurado en .env',
      );
      throw new Error(
        'El secreto del webhook de MercadoPago no está configurado.',
      );
    }

    const parts = signature.split(',');
    const timestamp = parts
      .find((part) => part.startsWith('ts='))
      ?.split('=')[1];
    const receivedHash = parts
      .find((part) => part.startsWith('v1='))
      ?.split('=')[1];

    if (!timestamp || !receivedHash) {
      throw new BadRequestException('Formato de firma de Webhook inválido.');
    }

    const manifest = `id:${notification.data.id};request-id:${requestId};ts:${timestamp};`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const calculatedHash = hmac.digest('hex');

    if (calculatedHash !== receivedHash) {
      console.error('--- [WEBHOOK] ¡VALIDACIÓN FALLIDA! La firma no coincide.');
      console.error(`> Manifest generado: ${manifest}`);
      console.error(`> Hash calculado: ${calculatedHash}`);
      console.error(`> Hash recibido: ${receivedHash}`);
      throw new BadRequestException(
        'Firma de Webhook inválida. La notificación podría ser fraudulenta.',
      );
    }

    console.log('--- [WEBHOOK] Firma validada exitosamente. ---');

    if (notification.type === 'payment' && notification.data?.id) {
      this.mercadoPagoService.handlePaymentNotification(notification.data.id);
    }

    return { received: true };
  }
  @Post('process-payment')
  @UseGuards(AuthGuard)
  async processPaymentFromBrick(
    @Body() body: { paymentId: string; orderData: any },
  ) {
    console.log(
      `--- [BRICK] Recibido paymentId: ${body.paymentId} para procesar ---`,
    );
    const { paymentId, orderData } = body;
    return this.mercadoPagoService.handleBrickPayment(paymentId, orderData);
  }
}
