import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  @Post('create-preference')
  async createPreference(@Body() body: { items: any[] }) {
    const preferenceId = await this.mercadoPagoService.createPreference(
      body.items,
    );
    return { preferenceId };
  }
  @Post('process-payment')
  async processPayment(@Body() paymentData: any) {
    return this.mercadoPagoService.processPayment(paymentData);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(@Body() notification: any) {
    if (notification.type === 'payment' && notification.data?.id) {
      this.mercadoPagoService.handlePaymentNotification(notification.data.id);
    }
    return { received: true };
  }
}
