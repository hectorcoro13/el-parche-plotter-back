import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/Auth/Auth.guard';
import { ExcludepasswordInterceptor } from 'src/interceptors/exlude-password.interceptor';
import { Roles } from 'src/decorators/roles.decorator';
import { role } from 'src/roles.enum';
import { RolesGuard } from 'src/Auth/roles.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/updateUser.dto';

@Controller('users')
@UseInterceptors(ExcludepasswordInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @HttpCode(200)
  @Get()
  @ApiBearerAuth()
  @Roles(role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  getUsers(@Query('page') page: string, @Query('limit') limit: string) {
    if (limit && page) {
      return this.usersService.getUsers(+page, +limit);
    }
    return this.usersService.getUsers();
  }
  @HttpCode(200)
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  getUserid(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getUserid(id);
  }
  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }
  @Put('block/:id')
  @ApiBearerAuth()
  @Roles(role.Admin)
  @UseGuards(AuthGuard, RolesGuard)
  blockUser(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    // <-- 2. Inyecta el objeto Request
    const adminId = req.user.id; // Obtenemos el ID del admin autenticado
    return this.usersService.blockUser(id, adminId); // <-- 3. Pasamos ambos IDs al servicio
  }
}
