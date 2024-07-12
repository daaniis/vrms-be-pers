import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { PrismaService } from 'src/prisma.service';
import { UsersModule } from 'src/users/users.module';
import { ConfigService } from 'src/config/config.service';
import { RecordLogService } from 'src/record_log/record_log.service';

@Module({
  imports: [UsersModule],
  controllers: [VendorsController],
  providers: [VendorsService, PrismaService, ConfigService, RecordLogService],
})
export class VendorsModule {}
