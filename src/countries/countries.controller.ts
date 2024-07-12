import { Controller, Get, Param, Query } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Dataset')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all country',
    description:
      'Mengambil daftar semua country dengan filter opsional search.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query('search') search: string) {
    return this.countriesService.findAll(search);
  }

  @Get(':country_id/states')
  @ApiOperation({
    summary: 'Get all state by country',
    description:
      'Mengambil daftar semua state pada country_id dengan filter opsional search.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  findStatesByCountry(
    @Param('country_id') country_id: string,
    @Query('search') search: string,
  ): any {
    return this.countriesService.findStatesByCountry(country_id, search);
  }

  @Get(':country_id/states/:state_id/cities')
  @ApiOperation({
    summary: 'Get all city by state and country',
    description:
      'Mengambil daftar semua city pada state_id dan country_id dengan filter opsional search.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  findCitiesByState(
    @Param('country_id') country_id: string,
    @Param('state_id') state_id: string,
    @Query('search') search: string,
  ): any {
    return this.countriesService.findCitiesByState(
      country_id,
      state_id,
      search,
    );
  }
}
