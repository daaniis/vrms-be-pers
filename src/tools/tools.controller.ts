/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, Query, UseGuards, SetMetadata } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { GetToolDto } from './dto/get-tool.dto';
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

@ApiTags('tools')
@ApiBearerAuth()
@Controller('master-data/tools')
@UseGuards(PublicGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  @SetMetadata('permissions', ['Master Data:Tools:Create:Create'])
  @UsePipes(new ValidationPipe())  
  async create(@Body() createToolDto: CreateToolDto) {
    return this.toolsService.create(createToolDto);
  }

  // @Get()
  // async findAll(@Query() getToolDto: GetToolDto) {
  //   return await this.toolsService.findAll(getToolDto);
  // }

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  async findAll(@Query() getToolDto: GetToolDto): Promise<Array<any>> {
    return await this.toolsService.findAll(getToolDto);
  }

  // select all
  @Get('select')
  async selectAll(@Query() getToolDto: GetToolDto): Promise<any> {
    return await this.toolsService.selectAll(getToolDto);
  }

  @Get(':id')
  @AllowAnyRole()
  findOne(@Param('id') id: string) {
    return this.toolsService.findOne({ tool_id: +id });
  }

  @Patch(':id')
  @SetMetadata('permissions', ['Master Data:Tools:Edit:Edit'])
  @UsePipes(new ValidationPipe())
  update(@Param('id') id: string, @Body() updateToolDto: UpdateToolDto) {
    return this.toolsService.update({ tool_id: +id }, updateToolDto);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.toolsService.remove({ tool_id: +id });
  // }

  // soft delete
  @Delete(':id')  
  @SetMetadata('permissions', ['Master Data:Tools:Delete:Delete'])
  async remove(@Param('id') id: string) {
    await this.toolsService.softDelete(+id);
    return { message: 'Tool berhasil dihapus' };
  }
}
