import { Module } from '@nestjs/common';
import { FinancialDirectoriesService } from './financial_directories.service';
import { FinancialDirectoriesController } from './financial_directories.controller';
import { PrismaService } from 'src/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from 'src/config/config.service';
import { Reflector } from '@nestjs/core';
import { UsersModule } from 'src/users/users.module';
import { RecordLogService } from 'src/record_log/record_log.service';

@Module({
  imports: [UsersModule],
  controllers: [FinancialDirectoriesController],
  providers: [FinancialDirectoriesService, PrismaService, ConfigService, Reflector, RecordLogService],
})
export class FinancialDirectoriesModule {}
