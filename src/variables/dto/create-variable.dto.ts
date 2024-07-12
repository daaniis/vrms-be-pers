import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVariableDto {
  @IsNotEmpty({ message: 'Harus Diisi' })
  @IsString()
  @MaxLength(255)
  variable_name: string;
}
