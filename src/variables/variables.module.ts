import { Module } from '@nestjs/common';
import { VariablesService } from './variables.service';
import { VariablesController } from './variables.controller';
import { PrismaService } from 'src/prisma.service';
import { ConfigService } from 'src/config/config.service';
import { Reflector } from '@nestjs/core';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [VariablesController],
  providers: [VariablesService, PrismaService, ConfigService, Reflector],
})
export class VariablesModule {}
