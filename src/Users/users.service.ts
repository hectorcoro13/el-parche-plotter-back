import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/updateUser.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}
  async getUsers(page: number = 1, limit: number = 100) {
    let users = await this.usersRepository.find();

    const start = (page - 1) * limit;
    const end = start + limit;

    return (users = users.slice(start, end));
  }
  async getUserid(id: string) {
    if (!id) {
      throw new NotFoundException('id is necesary');
    }
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { order: true },
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updatedUser = this.usersRepository.merge(user, updateUserDto);
    if (
      !updatedUser.isProfileComplete &&
      updatedUser.address &&
      updatedUser.phone &&
      updatedUser.city
    ) {
      updatedUser.isProfileComplete = true;
    }

    return this.usersRepository.save(updatedUser);
  }
  async blockUser(id: string, adminId: string) {
    // <-- 1. Acepta el ID del admin
    // --- VALIDACIÓN AÑADIDA ---
    if (id === adminId) {
      throw new ForbiddenException('No puedes bloquearte a ti mismo.');
    }
    // --- FIN DE LA VALIDACIÓN ---

    const userToBlock = await this.usersRepository.findOneBy({ id });
    if (!userToBlock) {
      throw new NotFoundException('User not found');
    }
    if (userToBlock.isAdmin) {
      throw new ForbiddenException('Administrators cannot be blocked.');
    }

    userToBlock.isBlocked = !userToBlock.isBlocked;
    await this.usersRepository.save(userToBlock);

    return {
      message: `User ${userToBlock.name} has been ${userToBlock.isBlocked ? 'blocked' : 'unblocked'}.`,
    };
  }
}
