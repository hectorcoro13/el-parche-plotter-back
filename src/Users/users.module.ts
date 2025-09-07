import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.Controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class usersModule {}
