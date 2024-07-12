/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

interface MenuItem {
  menu_name: string;
  children?: MenuItem[];
}

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}  

  // async findAll(): Promise<any> {
  //   const menus = await this.prisma.menu.findMany();
  //   const nestedMenus: any = {};

  //   // Fungsi untuk membangun menu nested
  //   const buildMenuTree = (menuList, parentId = null) => {
  //     const result = {};
  //     menuList
  //       .filter(menu => menu.parentId === parentId)
  //       .forEach(menu => {
  //         result[menu.menu_name] = buildMenuTree(menuList, menu.menu_id);
  //       });
  //     return result;
  //   };

  //   // Membangun menu nested dari root (parentId null)
  //   Object.assign(nestedMenus, buildMenuTree(menus));
    
  //   // Log structure for debugging
  //   console.log('Nested Menus Constructed:', JSON.stringify(nestedMenus, null, 2));
  //   return nestedMenus;
  // }
  async findAll(): Promise<MenuItem[]> {
    const menus = await this.prisma.menu.findMany();
  
    // Fungsi untuk membangun menu nested
    const buildMenuTree = (menuList, parentId = null): MenuItem[] => {
      const result: MenuItem[] = [];
      menuList
        .filter(menu => menu.parentId === parentId)
        .forEach(menu => {
          const childMenu: MenuItem = {
            menu_name: menu.menu_name,
            children: buildMenuTree(menuList, menu.menu_id),
          };
          result.push(childMenu);
        });
      return result;
    };
  
    // Membangun menu nested dari root (parentId null)
    const nestedMenus = buildMenuTree(menus);
  
    // Log structure for debugging
    console.log('Nested Menus Constructed:', JSON.stringify(nestedMenus, null, 2));
    return nestedMenus;
  }
  
}
      

