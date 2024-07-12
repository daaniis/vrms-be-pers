import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsEnum,
  ArrayUnique,
} from 'class-validator';
import { TipeTemplate } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTemplateDto {
  @IsNotEmpty({ message: 'Harus Diisi' })
  @IsString()
  @MaxLength(255)
  @ApiProperty()
  template_name: string;

  @IsNotEmpty({ message: 'Harus Diisi' })
  @IsString({ each: true })
  @ApiProperty()
  variable: string[];
}
