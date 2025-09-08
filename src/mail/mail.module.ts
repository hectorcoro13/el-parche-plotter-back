import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'; // <-- 1. IMPORTA EL ADAPTADOR
import { join } from 'path'; // <-- 2. IMPORTA 'join' DE NODE.JS

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST'),
          secure: true,
          port: 465,
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASSWORD'),
          },
          tls: {
            rejectUnauthorized: false,
          },
        },
        defaults: {
          from: `"El Parche Plotter" <${configService.get('MAIL_FROM')}>`,
        },
        // --- 3. AÑADE LA CONFIGURACIÓN DE LA PLANTILLA ---
        template: {
          dir: join(__dirname, 'templates'), // Apunta a la carpeta que creamos
          adapter: new HandlebarsAdapter(), // Le dice a Nest que use Handlebars
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class MailModule {}
