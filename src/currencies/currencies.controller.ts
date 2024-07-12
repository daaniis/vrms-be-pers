import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Dataset')
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all currency',
    description:
      'Mengambil daftar semua currency dengan filter opsional search.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query('search') search: string) {
    return this.currenciesService.findAll(search);
  }
}
