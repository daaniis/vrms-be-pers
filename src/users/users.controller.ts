/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, UseGuards, Query, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicGuard } from 'src/guard/public.guard';
import { GetUserDto } from './dto/get_user.dto';
import { SuperAdminOnly } from 'src/decorators/superadmin-only.decorator';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';


@Controller('system-administrator')
@ApiTags('System Administrator')
@ApiBearerAuth()
@UseGuards(PublicGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,    
  ) {}

  @Post()  
  @SuperAdminOnly()
  @UsePipes(new ValidationPipe())
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()  
  @SuperAdminOnly()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() getUserDto: GetUserDto) {
    return await this.usersService.findAllUser(getUserDto);
  }

  @Get(':id')  
  @SuperAdminOnly()
  async findOne(@Param('id') id: string) {
    return await this.usersService.findOne({user_id: +id});
  }

  @Patch(':id')
  @SuperAdminOnly()
  @UsePipes(new ValidationPipe())
  @UseGuards(PublicGuard)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update({ user_id: +id }, updateUserDto);
  }

  @Delete(':id')  
  @SuperAdminOnly()
  @UseGuards(PublicGuard)
  async remove(@Param('id') id: string) {
    try {
      await this.usersService.remove(+id);
    } catch (error) {
      console.error('Error bro', error);
      throw new InternalServerErrorException('Gagal Menghapus Akun!');
    }
  }
}
