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
  ) {
    // --- LÓGICA DE VALIDACIÓN AÑADIDA ---
    if (!signature) {
      throw new BadRequestException('Firma de Webhook ausente.');
    }

    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error(
        'El secreto del webhook de MercadoPago no está configurado.',
      );
    }

    // Separamos el timestamp (ts) y el hash (v1) de la firma
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

    // Creamos la firma que nosotros esperamos
    const manifest = `id:${notification.data.id};request-id:${notification.id};ts:${timestamp};`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const calculatedHash = hmac.digest('hex');

    // Comparamos nuestra firma con la que recibimos
    if (calculatedHash !== receivedHash) {
      throw new BadRequestException(
        'Firma de Webhook inválida. La notificación podría ser fraudulenta.',
      );
    }
    // --- FIN DE LA LÓGICA DE VALIDACIÓN ---

    // Si la firma es válida, procesamos la notificación
    if (notification.type === 'payment' && notification.data?.id) {
      this.mercadoPagoService.handlePaymentNotification(notification.data.id);
    }

    return { received: true };
  }
}
