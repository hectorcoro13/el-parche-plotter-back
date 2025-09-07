import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { AuthService } from './Auth.service';
import { CreateUserDto, LoginDto } from 'src/Users/dto/CreateUser.dto';
import { ExcludepasswordInterceptor } from 'src/interceptors/exlude-password.interceptor';
// import { BlockUser } from './auth.blockUser';

@Controller('auth')
@UseInterceptors(ExcludepasswordInterceptor)
export class AuthController {
  constructor(private readonly AuthService: AuthService) {}

  @Post('signin')
  Signin(@Body() Credential: LoginDto) {
    return this.AuthService.signIn(Credential);
  }
  @Post('/signup')
  sigUp(@Body() user: CreateUserDto) {
    return this.AuthService.signup(user);
  }
}
