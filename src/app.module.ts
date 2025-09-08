import { Module } from '@nestjs/common';
import { usersModule } from './Users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeOrmConfig from './config/typeorm';
import { ProductsModule } from './Products/Products.module';
import { AuthModule } from './Auth/Auth.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { JwtModule } from '@nestjs/jwt';
import { DashboardModule } from './dashboard/dashboard.module';
import { MailModule } from './mail/mail.module';
import { MercadoPagoModule } from './mercadoPago/mercadopago.module';
import { CartModule } from './cart/cart.module';
import { Auth0Module } from './auth0/auth0.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsService } from './Products/Products.service';
import { CategoriesService } from './categories/categories.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeOrmConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (ConfigService: ConfigService) =>
        ConfigService.get('typeorm')!,
    }),
    usersModule,
    CategoriesModule,
    ProductsModule,
    AuthModule,
    OrdersModule,
    FileUploadModule,
    DashboardModule,
    MercadoPagoModule,
    CartModule,
    MailModule,
    Auth0Module,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ProductsService, CategoriesService],
})
export class AppModule {}
