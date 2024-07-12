import { PartialType } from '@nestjs/mapped-types';
import { CreateRateTypeDto } from './create-rate_type.dto';

export class UpdateRateTypeDto extends PartialType(CreateRateTypeDto) {}
