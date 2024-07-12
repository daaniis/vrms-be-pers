import { PartialType } from '@nestjs/mapped-types';
import { CreateFinancialDirectoryDto } from './create-financial_directory.dto';

export class UpdateFinancialDirectoryDto extends PartialType(
  CreateFinancialDirectoryDto,
) {}
