import { PartialType } from '@nestjs/mapped-types';
import { CreateNonTranslationDto, CreateTranslationDto } from './create-freelance.dto';

export class UpdateTranslationDto extends PartialType(CreateTranslationDto) { }
export class UpdateNonTranslationDto extends PartialType(CreateNonTranslationDto) { }
