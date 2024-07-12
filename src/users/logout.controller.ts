/* eslint-disable prettier/prettier */
import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { PublicGuard } from 'src/guard/public.guard';
import { ApiTags } from '@nestjs/swagger';

@Controller('logout')
@ApiTags('Logout')

export class LogoutController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(PublicGuard)
  async logout(@Request() req: any) {
    try {
      // console.log('SELAMAT');
      const token = req.headers.authorization.split(' ')[1];
      await this.usersService.logout(token);
      return { message: 'Logout Berhasil!' };
    } catch (error) {
      console.error('Gagal Logout', error);
      throw new Error('Gagal Logout');
    }
  }   
}
