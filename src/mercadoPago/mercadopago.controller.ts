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
    const isValid = this.mercadoPagoService.validateWebhookSignature(
      signature,
      requestId,
      notification.data.id,
    );
    if (!isValid) {
      throw new BadRequestException('Firma de Webhook inválida.');
    }

    if (notification.type === 'payment') {
      console.log(
        `--- [WEBHOOK] Notificación recibida para el pago: ${notification.data.id}`,
      );
      this.mercadoPagoService.handlePaymentNotification(notification.data.id);
    }

    return { received: true };
  }

  @Post('process-payment')
  @UseGuards(AuthGuard)
  async processPaymentFromBrick(@Req() req, @Body() paymentData: any) {
    if (!paymentData || !paymentData.formData) {
      throw new BadRequestException('Datos de pago incompletos o inválidos.');
    }
    const user = req.user;
    console.log(
      `--- [BACKEND] Recibidos datos para procesar pago del usuario: ${user.id} ---`,
    );
    return this.mercadoPagoService.createPaymentFromBrick(paymentData, user);
  }
}
