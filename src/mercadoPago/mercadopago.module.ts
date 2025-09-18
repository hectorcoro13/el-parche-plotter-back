import { Module } from '@nestjs/common';
import { MercadoPagoController } from './mercadopago.controller';
import { MercadoPagoService } from './mercadopago.service';
import { OrdersModule } from 'src/orders/orders.module';
import { CartModule } from 'src/cart/cart.module';
import { MailModule } from 'src/mail/mail.module';
import { ProductsModule } from 'src/Products/Products.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/Users/entities/user.entity';
import { Orders } from 'src/orders/entities/order.entity';
import { PdfModule } from 'src/pdf/pdf.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Orders]),
    OrdersModule,
    CartModule,
    MailModule,
    ProductsModule,
    PdfModule,
  ],
  controllers: [MercadoPagoController],
  providers: [MercadoPagoService],
})
export class MercadoPagoModule {}
