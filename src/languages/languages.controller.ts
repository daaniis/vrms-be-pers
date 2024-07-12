import { Controller, Get, Param, Query } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Dataset')
@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all language',
    description:
      'Mengambil daftar semua language dengan filter opsional search.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query('search') search: string) {
    return this.languagesService.findAll(search);
  }
}
