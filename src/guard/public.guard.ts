/* eslint-disable prettier/prettier */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../config/config.service';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
import { ALLOW_ANY_ROLE_KEY } from 'src/decorators/allow-any-role.decorator';
import { SUPERADMIN_ONLY_KEY } from 'src/decorators/superadmin-only.decorator';

@Injectable()
export class PublicGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true; // Jika rute atau metode publik, izinkan akses
    }
    const allowAnyRole = this.reflector.getAllAndOverride<boolean>(
      ALLOW_ANY_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    const superadminOnly = this.reflector.getAllAndOverride<boolean>(
      SUPERADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );
    const authHeader = request.headers?.authorization;
    console.log('Auth Header:', authHeader);    
    if (!authHeader) {
      throw new UnauthorizedException('Invalid Token!');
    }
    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = await this.jwtService.verify(token, {
        secret: this.configService.JWT_SECRET,
      });
      console.log('Decoded token:', decodedToken);
      request.user = decodedToken;
      // ekstrak menu permissions dari token
      const { role, menu } = decodedToken;
      console.log('User Role:', role);
      console.log('User Menu:', menu);
      if (superadminOnly && role !== 'Superadmin') {
        throw new ForbiddenException('Access denied!');
      }
      // Jika rute bisa diakses oleh semua role, cukup periksa token valid
      if (allowAnyRole) {
        return true;
      }
      // memeriksa apakah akun punya akses 
      const requiredPermissions = this.reflector.get<string[]>(
        'permissions',
        context.getHandler(),
      );
      if (!this.hasPermission(menu, requiredPermissions)) {
        throw new UnauthorizedException('You do not have access to this menu.');
      }
      return true;
    } catch (error) {
      console.error('JWT Verification Error:', error);
      throw new UnauthorizedException(error.message);
    }
  }

  hasPermission(userMenu: any, requiredPermissions: string[]): boolean {
    if (!requiredPermissions) {
      return true; // If no specific permissions are required, grant access
    }
    // Flatten user permissions for easier checking
    const userPermissions = this.flattenPermissions(userMenu);
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }

  // menu dalam bentuk json diubah jadi array
  flattenPermissions(menu: any): string[] {
    const permissions: string[] = [];
    function traverse(menuItem: any, parentKey: string = '') {
      if (Array.isArray(menuItem)) {
        menuItem.forEach((item) => traverse(item, parentKey));
      } else if (typeof menuItem === 'object') {
        for (const key in menuItem) {
          traverse(menuItem[key], parentKey ? `${parentKey}:${key}` : key);
        }
      } else if (typeof menuItem === 'string') {
        permissions.push(`${parentKey}:${menuItem}`);
      }
    }
    traverse(menu);
    console.log('Flattened Permissions:', permissions);
    return permissions;
  }
}
