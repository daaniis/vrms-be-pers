/* eslint-disable prettier/prettier */
import { Controller, Get } from '@nestjs/common';
import { MenusService } from './menus.service';

interface MenuItem {
  menu_name: string;
  children?: MenuItem[];
}

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  // @Get()
  // async findAll(): Promise<Map<string, any>> {
  //   return this.menusService.findAll();
  // }

  @Get()
  async findAll(): Promise<MenuItem[]> {
    return this.menusService.findAll();
  }

}
