import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateToolDto {
  @IsNotEmpty({ message: 'Harus Diisi' })
  @IsString()
  @MaxLength(255)
  @ApiProperty()
  tool_name: string;
}
