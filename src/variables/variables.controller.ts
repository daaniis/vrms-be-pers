import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { VariablesService } from './variables.service';
import { PublicGuard } from 'src/guard/public.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('variable')
@ApiBearerAuth()
@Controller('master-data/variables')
// @UseGuards(PublicGuard)
export class VariablesController {
  constructor(private readonly variablesService: VariablesService) {}
  @Get('translation')
  findAllTranslation() {
    return this.variablesService.findAllTranslation();
  }

  @Get('non-translation')
  findAllNonTranslation() {
    return this.variablesService.findAllNonTranslation();
  }

  @Get('vendor')
  findAllVendor() {
    return this.variablesService.findAllVendor();
  }
}
