import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceStatusVendor } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

enum CalcUnit {
  Minute = 'Minute',
  Hour = 'Hour',
  Day = 'Day',
  Month = 'Month',
  Year = 'Year',
  SourceWord = 'SourceWord',
  SourceCharacter = 'SourceCharacter',
  Page = 'Page',
  Image = 'Image',
  Package = 'Package',
  Lifetime = 'Lifetime',
}

class RateDto {
  @ApiProperty({ description: 'Type of service' })
  @IsOptional()
  @IsString()
  type_of_service: string;

  @ApiProperty({ description: 'Rate amount' })
  @IsOptional()
  @IsNumber()
  rate: number;

  @ApiProperty({ description: 'Rate type ID' })
  @IsOptional()
  @IsNumber()
  rate_type_id: number;

  @ApiProperty({ description: 'Calculation unit', enum: CalcUnit })
  @IsOptional()
  @IsEnum(CalcUnit)
  calc_unit: CalcUnit;
}

export class CreateVendorDto {
  @ApiProperty({ description: 'Vendor name' })
  @IsNotEmpty()
  @IsString()
  vendor_name: string;

  @ApiProperty({ description: 'Whatsapp number' })
  @IsNotEmpty()
  @IsString()
  whatsapp: string;

  @ApiProperty({ description: 'PIC name' })
  @IsNotEmpty()
  @IsString()
  pic_name: string;

  @ApiProperty({ description: 'Email address' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contact via' })
  @IsNotEmpty()
  @IsString()
  contact_via: string;

  @ApiProperty({ description: 'Country ID' })
  @IsNotEmpty()
  @IsNumber()
  country_id: number;

  @ApiProperty({ description: 'State ID' })
  @IsNotEmpty()
  @IsNumber()
  state_id: number;

  @ApiProperty({ description: 'City ID' })
  @IsNotEmpty()
  @IsNumber()
  city_id: number;

  @ApiProperty({ description: 'District' })
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty({ description: 'Postal code' })
  @IsNotEmpty()
  postal_code: string;

  @ApiPropertyOptional({ description: 'Full address' })
  @IsOptional()
  @IsString()
  full_address: string;

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsOptional()
  @IsString()
  bank_name: string;

  @ApiPropertyOptional({ description: 'Branch office' })
  @IsOptional()
  @IsString()
  branch_office: string;

  @ApiPropertyOptional({ description: 'Account holder name' })
  @IsOptional()
  @IsString()
  account_holder_name: string;

  @ApiPropertyOptional({ description: 'Account number' })
  @IsOptional()
  account_number: string;

  @ApiPropertyOptional({ description: 'Name tax' })
  @IsOptional()
  @IsString()
  name_tax: string;

  @ApiPropertyOptional({
    description: 'Resource status',
    enum: ResourceStatusVendor,
  })
  @IsOptional()
  resource_status: ResourceStatusVendor;

  @ApiPropertyOptional({ description: 'NPWP number' })
  @IsOptional()
  npwp_number: string;

  @ApiPropertyOptional({ description: 'Currency ID' })
  @IsOptional()
  @IsNumber()
  currency_id: number;

  @ApiPropertyOptional({ description: 'List of rates', type: [RateDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RateDto)
  list_rate: RateDto[];
}
