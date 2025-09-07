import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { globalMiddleware } from './middlewares/logger.middleware';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getAuth0Config } from './config/auth0.config';
import { Auth0Service } from './auth0/auth0.service';
import { auth } from 'express-openid-connect';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://v0-e-commerce-store-build-lemon.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ecommerce')
    .setDescription(
      'Esta es una Api contruida con NestJS para ser empleada en un ecommerce',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api', app, document);

  const auth0Service = app.get(Auth0Service);
  const auth0Config = getAuth0Config(auth0Service);

  app.use(auth(auth0Config));

  app.use(globalMiddleware);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
