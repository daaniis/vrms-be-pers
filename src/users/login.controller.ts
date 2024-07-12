/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Session,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { LoginUserInput } from './dto/login-user.input';
import { Public } from 'src/decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';

@Controller('login')
@ApiTags('Login')
export class LoginController {
  constructor(private readonly usersService: UsersService) {}
  // rute login
  @Post()
    async login(
      @Body() loginUserDto: LoginUserInput,
      @Session() session: Record<string, any>,
    ) {
      try {
        const data = await this.usersService.login(loginUserDto);
        session.user = data;
        return { data };
      } catch (error) {
        throw new BadRequestException(
          'Email atau Password yang Anda Masukkan Tidak Sesuai!',
        );
      }
    }

  // cek session
  @Get('/me')
  @Public()
    async getLoggedInUser(@Session() session: Record<string, any>) {
      const userData = session.user;
      if (!userData) {
        return { message: 'Pengguna Belum Login!' };
      }
      return userData;
    }
}
