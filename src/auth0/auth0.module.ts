import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth0Controller } from './auth0.controller';
import { Auth0Service } from './auth0.service';
import { usersModule } from '../Users/users.module';
import { Users } from '../Users/entities/user.entity';

@Module({
  imports: [
    usersModule,
    TypeOrmModule.forFeature([Users]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        // CORRECCIÓN: Usa 'JWT_SECRET' en lugar de 'SECRET_KEY'
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [Auth0Controller],
  providers: [Auth0Service],
  exports: [Auth0Service],
})
export class Auth0Module {}
