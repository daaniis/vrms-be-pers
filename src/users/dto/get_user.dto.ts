/* eslint-disable prettier/prettier */
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class GetUserDto {
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
