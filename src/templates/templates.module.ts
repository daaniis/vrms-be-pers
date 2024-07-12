import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { PrismaService } from 'src/prisma.service';
import { ConfigService } from 'src/config/config.service';
import { Reflector } from '@nestjs/core';
import { UsersModule } from 'src/users/users.module';
import { RecordLogService } from 'src/record_log/record_log.service';

@Module({
  imports: [UsersModule],
  controllers: [TemplatesController],
  providers: [TemplatesService, PrismaService, ConfigService, Reflector, RecordLogService],
})
export class TemplatesModule {}
