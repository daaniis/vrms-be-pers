import { Module } from '@nestjs/common';
import { RateTypeService } from './rate_type.service';
import { RateTypeController } from './rate_type.controller';
import { PrismaService } from 'src/prisma.service';
import { ConfigService } from 'src/config/config.service';
import { Reflector } from '@nestjs/core';
import { UsersModule } from 'src/users/users.module';
import { RecordLogService } from 'src/record_log/record_log.service';

@Module({
  imports: [UsersModule],
  controllers: [RateTypeController],
  providers: [RateTypeService, PrismaService, ConfigService, Reflector, RecordLogService],
})
export class RateTypeModule {}
