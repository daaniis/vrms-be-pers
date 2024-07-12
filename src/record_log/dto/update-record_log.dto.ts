import { PartialType } from '@nestjs/swagger';
import { CreateRecordLogDto } from './create-record_log.dto';

export class UpdateRecordLogDto extends PartialType(CreateRecordLogDto) {}
