/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { ToolsController } from './tools.controller';
import { PrismaService } from '../prisma.service';
import { ConfigService } from 'src/config/config.service';
import { Reflector } from '@nestjs/core';
import { UsersModule } from 'src/users/users.module';
import { RecordLogService } from 'src/record_log/record_log.service';

@Module({
  imports: [UsersModule],
  controllers: [ToolsController],
  providers: [ToolsService, PrismaService, ConfigService, Reflector, RecordLogService],
})
export class ToolsModule {}
