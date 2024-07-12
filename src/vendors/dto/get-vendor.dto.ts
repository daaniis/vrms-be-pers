import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class GetVendorDto {
  @IsOptional()
  limit: string;

  @IsOptional()
  @IsInt()
  page: number;

  @IsOptional()
  @IsString()
  @IsIn(['newest', 'oldest'])
  sort_order: 'newest' | 'oldest';

  @IsOptional()
  @IsString()
  search: string;
}
