import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
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
  handleWebhook(@Body() notification: any) {
    if (notification.type === 'payment' && notification.data?.id) {
      this.mercadoPagoService.handlePaymentNotification(notification.data.id);
    }
    return { received: true };
  }
}
