import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/Users/entities/user.entity';
import { Orders } from './entities/order.entity';
import { OrderDetails } from './entities/orderDetails.entity';
import { Products } from 'src/Products/entities/products.entity';
import { PdfModule } from 'src/pdf/pdf.module';
import { CartModule } from 'src/cart/cart.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Orders, OrderDetails, Products]),
    CartModule,
    MailModule,
    PdfModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
