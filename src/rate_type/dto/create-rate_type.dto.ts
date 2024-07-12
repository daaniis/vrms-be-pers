import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateRateTypeDto {
  @IsNotEmpty({ message: 'Harus Diisi' })
  @IsString()
  @MaxLength(255)
  @ApiProperty()
  rate_type_name: string;
}
