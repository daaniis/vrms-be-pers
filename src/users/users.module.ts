/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from 'src/config/config.service';
import { PrismaService } from 'src/prisma.service';
import { PassportModule } from '@nestjs/passport';
import { LoginController } from './login.controller';
import { LogoutController } from './logout.controller';
import { RecordLogService } from 'src/record_log/record_log.service';
import { MenusService } from 'src/menus/menus.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: '0Js3dBNX8nMLvFGlP8p0',
      signOptions: { expiresIn: '1d' },
    }),
    PassportModule.register({ session: true }),
    ConfigModule,
  ],
  controllers: [UsersController, LoginController, LogoutController],
  providers: [UsersService, PrismaService, JwtService, ConfigService, RecordLogService, MenusService],
  exports: [UsersService, JwtModule],
})
export class UsersModule {}
