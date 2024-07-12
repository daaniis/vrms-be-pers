/* eslint-disable prettier/prettier */
import { ApiProperty } from "@nestjs/swagger";
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEmail, IsNotEmpty, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from "@prisma/client";

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    full_name: string;
  
    @IsNotEmpty()
    @IsEmail()
    @ApiProperty()
    email: string;

    @IsNotEmpty()
    @IsEnum(Role, { message: 'Role Tidak Valid!' })
    @ApiProperty()
    role: Role;
  
    @IsNotEmpty()
    @MinLength(8)
    @ApiProperty()
    password: string;
  
    
}
