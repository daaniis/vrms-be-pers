import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CreateFileDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  originalname: string;

  @IsString()
  @IsNotEmpty()
  id_file: string;
}

export class CreateFinancialDirectoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  financial_directory_name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFileDto)
  financial_directory_files: CreateFileDto[];
}
