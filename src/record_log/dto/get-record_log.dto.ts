/* eslint-disable prettier/prettier */
import { IsDateString, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class GetRecordLog {    
    @IsOptional()
    limit: string;

    @IsOptional()
    @IsInt()
    page: number;

    @IsOptional()
    menu?: string;

    @IsOptional()
    @IsString()
    @IsIn(['newest', 'oldest'])
    sort_order: 'newest' | 'oldest';

    @IsOptional()
    @IsString()
    search: string;

    @IsOptional()
    @IsDateString()
    start_date?: string;
    
    @IsOptional()
    @IsDateString()
    end_date?: string;
}