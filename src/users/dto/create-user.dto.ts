/* eslint-disable prettier/prettier */
import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { IsEmail, IsEnum, IsNotEmpty } from "class-validator";

export class CreateUserDto {
  @IsNotEmpty({ message: 'Fullname Harus Diisi' })
  @ApiProperty()
  full_name: string;

  @IsNotEmpty({ message: 'Email Harus Diisi' })
  @IsEmail({}, { message: 'Email Tidak Valid!' })
  @ApiProperty()
  email: string;

  @IsNotEmpty({ message: 'Password Harus Diisi' })
  @ApiProperty()
  password: string;

    @IsNotEmpty({ message: 'Role Harus Diisi'})
    @IsEnum(Role, { message: 'Role Tidak Valid!' })
    @ApiProperty()
    role: Role;
}
