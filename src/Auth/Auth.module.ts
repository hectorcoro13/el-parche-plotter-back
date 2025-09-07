import { Module } from '@nestjs/common';
import { AuthService } from './Auth.service';
import { AuthController } from './Auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/Users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users])],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
