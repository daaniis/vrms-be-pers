/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { FreelancesController } from './freelances.controller';
import { PrismaService } from 'src/prisma.service';
import { TranslationService } from './translation.service';
import { NonTranslationService } from './non-translation.service';
import { ConfigService } from 'src/config/config.service';
import { UsersModule } from 'src/users/users.module';
import { RecordLogService } from 'src/record_log/record_log.service';

@Module({
  imports: [UsersModule],
  controllers: [FreelancesController],
  providers: [
    TranslationService,
    NonTranslationService,
    PrismaService,
    ConfigService,
    RecordLogService,
  ],
})
export class FreelancesModule {}
