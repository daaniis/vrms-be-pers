/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { RecordLogService } from './record_log.service';
import { RecordLogController } from './record_log.controller';
import { PrismaService } from 'src/prisma.service';
import { ConfigService } from 'src/config/config.service';
import { Reflector } from '@nestjs/core';

@Module({
  controllers: [RecordLogController],
  providers: [RecordLogService, PrismaService, ConfigService, Reflector],
  exports: [ RecordLogService],
})
export class RecordLogModule {}
