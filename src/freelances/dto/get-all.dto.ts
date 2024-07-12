import { IsInt, IsOptional, IsString, IsIn } from 'class-validator';

export class GetAllDto {
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
