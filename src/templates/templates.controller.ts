/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  SetMetadata,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Response } from 'express';
import { GetTemplateDto } from './dto/get-template.dto';
import { Template } from '@prisma/client';
import { PublicGuard } from 'src/guard/public.guard';
import { AllowAnyRole } from 'src/decorators/allow-any-role.decorator';
import { Public } from 'src/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('templates')
@ApiBearerAuth()
@Controller('master-data/templates')
@UseGuards(PublicGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // @Post()
  // create(@Body() createTemplateDto: CreateTemplateDto) {
  //   return this.templatesService.create(createTemplateDto);
  // }

  // @Get()
  // findAll() {
  //   return this.templatesService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.templatesService.findOne({ template_id: +id });
  // }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateTemplateDto: UpdateTemplateDto,
  // ) {
  //   return this.templatesService.update(+id, updateTemplateDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.templatesService.remove(+id);
  // }

  // @Get(':templateId/export/:format')
  // async export(
  // @Param('templateId') templateId: string,
  // @Param('format') format: string,
  // @Res() res: Response,
  // ) {
  // await this.templatesService.export(+templateId, format, res);
  // }

  // TRANSLATION
  @Get('translation')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  async findManyTranslation(
    @Query() getTemplateDto: GetTemplateDto,
  ): Promise<Template[]> {
    return this.templatesService.findManyTranslation(getTemplateDto);
  }

  // @Get()
  // async findAll(@Query() getTemplateDto: GetTemplateDto) {
  //   return await this.templatesService.findAll(getTemplateDto);

  @Get('translation/:id')
  @AllowAnyRole()
  findOneTranslation(@Param('id') id: string) {
    return this.templatesService.findOneTranslation({ template_id: +id });
  }

  @Post('translation')
  @SetMetadata('permissions', ['Master Data:Variable Input Form:Translation:Create:Create'])
  @UsePipes(new ValidationPipe())
  createTranslation(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.createTranslation(createTemplateDto);
  }

  @Patch('translation/:template_id')
  @SetMetadata('permissions', ['Master Data:Variable Input Form:Translation:Edit:Edit'])
  @UsePipes(new ValidationPipe())
  updateTranslation(
    @Param('template_id') template_id: number,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templatesService.updateTranslation(
      +template_id,
      updateTemplateDto,
    );
  }

  @Delete('translation/:id')
  @SetMetadata('permissions', ['Master Data:Variable Input Form:Translation:Delete:Delete'])
  removeTranslation(@Param('id') id: string) {
    return this.templatesService.removeTranslation(+id);
  }

  @Public()
  @Get('translation/:template_id/export/:format')
  @AllowAnyRole()
  exportTranslation(
    @Param('template_id') template_id: string,
    @Param('format') format: string,
    @Res() res: Response,
  ) {
    return this.templatesService.exportTranslation(+template_id, format, res);
  }

  // NON TRANSLATION
  @Get('non-translation')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()  
  findAllNonTranslation(
    @Query() getTemplateDto: GetTemplateDto,
  ): Promise<Template[]> {
    return this.templatesService.findManyNonTranslation(getTemplateDto);
  }

  @Get('non-translation/:id')
  @AllowAnyRole()
  findOneNonTranslation(@Param('id') id: string) {
    return this.templatesService.findOneNonTranslation({ template_id: +id });
  }

  @Post('non-translation')
  @SetMetadata('permissions', ['Master Data:Variable Input Form:Non Translation:Create:Create'])
  @UsePipes(new ValidationPipe())
  createNonTranslation(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.createNonTranslation(createTemplateDto);
  }

  @Patch('non-translation/:template_id')
  @SetMetadata('permissions', ['Master Data:Variable Input Form:Non Translation:Edit:Edit'])
  @UsePipes(new ValidationPipe())
  updateNonTranslation(
    @Param('template_id') template_id: number,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templatesService.updateNonTranslation(
      +template_id,
      updateTemplateDto,
    );
  }

  @Delete('non-translation/:id')
  @SetMetadata('permissions', ['Master Data:Variable Input Form:Non Translation:Delete:Delete'])
  removeNonTranslation(@Param('id') id: string) {
    return this.templatesService.removeNonTranslation(+id);
  }

  @Public()
  @Get('non-translation/:template_id/export/:format')
  @AllowAnyRole()
  exportNonTranslation(
    @Param('template_id') template_id: string,
    @Param('format') format: string,
    @Res() res: Response,
  ) {
    return this.templatesService.exportNonTranslation(
      +template_id,
      format,
      res,
    );
  }

  // VENDOR
  @Get('vendor')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  findAllVendor(@Query() getTemplateDto: GetTemplateDto): Promise<Template[]> {
    return this.templatesService.findManyVendor(getTemplateDto);
  }

  @Get('vendor/:id')
  @AllowAnyRole()
  findOneVendor(@Param('id') id: string) {
    return this.templatesService.findOneVendor({ template_id: +id });
  }

  @Post('vendor')
  @SetMetadata('permissions', ['Master Data:Variable Input Form:Vendor:Create:Create'])
  @UsePipes(new ValidationPipe())
  createVendor(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.createVendor(createTemplateDto);
  }

  @Patch('vendor/:template_id')
  @SetMetadata('permissions', ['Master Data:Variable Input Form:Vendor:Edit:Edit'])
  @UsePipes(new ValidationPipe())
  updateVendor(
    @Param('template_id') template_id: number,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templatesService.updateVendor(+template_id, updateTemplateDto);
  }

  @Delete('vendor/:id')
  @SetMetadata('permissions', ['Master Data:Variable Input Form:Vendor:Delete:Delete'])
  removeVendor(@Param('id') id: string) {
    return this.templatesService.removeVendor(+id);
  }

  @Public()
  @Get('vendor/:template_id/export/:format')
  @AllowAnyRole()
  exportVendor(
    @Param('template_id') template_id: string,
    @Param('format') format: string,
    @Res() res: Response,
  ) {
    return this.templatesService.exportVendor(+template_id, format, res);
  }
}
