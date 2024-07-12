/* eslint-disable prettier/prettier */
import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RecordLogService } from './record_log.service';
import { PublicGuard } from 'src/guard/public.guard';
import { AllowAnyRole } from 'src/decorators/allow-any-role.decorator';
import { GetRecordLog } from './dto/get-record_log.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

@Controller('record-log')
@ApiTags('Record Log')
@ApiQuery({ name: 'menu', required: false })
@ApiQuery({ name: 'startDate', required: false })
@ApiQuery({ name: 'endDate', required: false })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
@ApiQuery({ name: 'search', required: false, type: String })
@ApiBearerAuth()
@UseGuards(PublicGuard)
export class RecordLogController {
  constructor(private readonly recordLogService: RecordLogService) {}  
  @Get()
  @AllowAnyRole()
  async filterLogs(
    @Query('menu') menu?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query() getLogDto?: GetRecordLog,
  ): Promise<any> {
    const encodedMenu = menu ? encodeURIComponent(menu) : undefined;
    if ((startDate && !endDate) || (!startDate && endDate)) {
      throw new BadRequestException('Both start date and end date must be provided');
    }
    return await this.recordLogService.findAll(menu, startDate, endDate, getLogDto);
  }  
}
