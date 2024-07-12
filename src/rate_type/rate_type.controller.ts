/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  SetMetadata,
} from '@nestjs/common';
import { RateTypeService } from './rate_type.service';
import { CreateRateTypeDto } from './dto/create-rate_type.dto';
import { UpdateRateTypeDto } from './dto/update-rate_type.dto';
import { GetRateTypeDto } from './dto/get-rate_type.dto';
import { PublicGuard } from 'src/guard/public.guard';
import { AllowAnyRole } from 'src/decorators/allow-any-role.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('rate-types')
@ApiBearerAuth()
@Controller('master-data/rate-types')
@UseGuards(PublicGuard)
export class RateTypeController {
  constructor(private readonly rateTypeService: RateTypeService) {}

  @Post()
  @SetMetadata('permissions', ['Master Data:Rate Type:Create:Create'])
  @UsePipes(new ValidationPipe())
  async create(@Body() createRateTypeDto: CreateRateTypeDto) {
    return this.rateTypeService.create(createRateTypeDto);
  }

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  async findAll(@Query() getRateTypeDto: GetRateTypeDto) {
    return await this.rateTypeService.findAll(getRateTypeDto);
  }

  // select all
  @Get('select')
  async selectAll(@Query() getRateTypeDto: GetRateTypeDto): Promise<any> {
    return await this.rateTypeService.selectAll(getRateTypeDto);
  }

  @Get(':id')
  @AllowAnyRole()
  findOne(@Param('id') id: string) {
    return this.rateTypeService.findOne({ rate_type_id: +id });
  }

  @Patch(':id')
  @SetMetadata('permissions', ['Master Data:Rate Type:Edit:Edit'])
  @UsePipes(new ValidationPipe())
  update(
    @Param('id') id: string,
    @Body() updateRateTypeDto: UpdateRateTypeDto,
  ) {
    return this.rateTypeService.update(
      { rate_type_id: +id },
      updateRateTypeDto,
    );
  }

  @Delete(':rateTypeId')
  @SetMetadata('permissions', ['Master Data:Rate Type:Delete:Delete'])
  async remove(@Param('rateTypeId') rateTypeId: string) {
    await this.rateTypeService.softDelete(+rateTypeId);
    return { message: 'Rate Type berhasil dihapus' };
  }
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.rateTypeService.softDelete({rate_type_id: +id});
  // }
}
