import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from 'src/Users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, LoginDto } from 'src/Users/dto/CreateUser.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async signup(
    user: CreateUserDto,
  ): Promise<{ message: string; user: Partial<Users>; token: string }> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordConfirm, ...userWithoutPassword } = user;
    const findUser = await this.usersRepository.findOneBy({
      email: user.email,
    });
    if (findUser) {
      throw new BadRequestException('User already registered');
    }
    const hasedPassword = await bcrypt.hash(user.password, 10);

    const createUser: Users = this.usersRepository.create({
      ...userWithoutPassword,
      password: hasedPassword,

      isProfileComplete: true,
    });
    const newUser = await this.usersRepository.save(createUser);

    await this.mailerService.sendMail({
      to: newUser.email,
      subject: '¡Bienvenido a El Parche Plotter!',
      template: './welcome', // <-- Usa el nombre del archivo sin .hbs
      context: {
        name: newUser.name, // <-- Pasa la variable 'name' a la plantilla
      },
    });

    const payload = {
      id: newUser.id,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
    };
    const token = this.jwtService.sign(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPwd } = newUser;
    return {
      message: 'User registered successfully',
      user: userWithoutPwd,
      token,
    };
  }
  async signIn(
    credentials: LoginDto,
  ): Promise<{ message: string; token: string }> {
    const findUser: Users | null = await this.usersRepository.findOneBy({
      email: credentials.email,
    });
    if (!findUser) throw new BadRequestException('bad credential');

    if (findUser.isBlocked) {
      throw new UnauthorizedException(
        'Tu cuenta ha sido bloqueada por un administrador.',
      );
    }

    const mathingPasswords = await bcrypt.compare(
      credentials.password,
      findUser.password,
    );
    if (!mathingPasswords) throw new BadRequestException('Bad credentials');
    const payload = {
      id: findUser.id,
      email: findUser.email,
      isAdmin: findUser.isAdmin,
    };

    const token = this.jwtService.sign(payload);
    return { message: 'Login successful', token: token };
  }
}
