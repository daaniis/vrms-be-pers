/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,  
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginUserInput } from './dto/login-user.input';
import { ConfigService } from 'src/config/config.service';
import { isEmail } from 'class-validator';
import { PrismaService } from 'src/prisma.service';
import * as jwt from 'jsonwebtoken';
import { GetUserDto } from './dto/get_user.dto';
import { RecordLogService } from 'src/record_log/record_log.service';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class UsersService {
  private readonly blacklist: Set<string> = new Set();
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logService: RecordLogService,    
    @Inject(REQUEST) private readonly request: any,
    ) {}

  // Fungsi untuk mengonversi struktur menu menjadi string
    private flattenMenu(menu: any): string {
      const result: string[] = [];
    
      const traverse = (obj: any, parentKey: string = '') => {
        for (const key in obj) {
          if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            const actions = [];
            for (const actionKey in obj[key]) {
              if (typeof obj[key][actionKey] === 'string') {
                actions.push(actionKey);
              }
            }
            if (actions.length > 0) {
              const formattedActions = actions.join(', ');
              result.push(`${parentKey ? `${parentKey} - ` : ''}${key} (${formattedActions})`);
            }
            traverse(obj[key], key); // Hanya menggunakan `key` sebagai parentKey untuk traversal berikutnya
          }
        }
      };  
      traverse(menu);
      return result.join('\n\n');
    }  
  
  // format value record log
    private formatValue(value: any): string {
      if (typeof value === 'object' && !Array.isArray(value)) {
        return this.flattenMenu(value);
      }
      return String(value);
    }
  
  // buat record log
    private formatField(fieldName: string): string {
      return fieldName
        .split('_') // Memisahkan kata yang dipisahkan oleh underscore
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Mengubah huruf pertama menjadi kapital
        .join(' '); // Menggabungkan kembali dengan spasi
    }  

  // fungsi untuk validasi pass minimal 8 karakter
    private async validatePassword(password: string): Promise<boolean> {
      return password.length >= 8;
    }

  // Fungsi untuk transformasi menu  
    private transformMenu(menu: any): any {
      if (Array.isArray(menu)) {
          const transformedMenu = {};
          menu.forEach(item => {
              const key = Object.keys(item)[0];
              transformedMenu[key] = this.transformMenu(item[key]);
          });
          return transformedMenu;
      } else if (typeof menu === 'object' && menu !== null) {
          const transformedMenu = {};
          Object.keys(menu).forEach(key => {
              transformedMenu[key] = this.transformMenu(menu[key]);
          });
          return transformedMenu;
      } else {
          return menu;
      }
    }
  
  async create(createUserDto: Prisma.UserCreateInput): Promise<User> {      
      // validasi password 8 karakter
      if ( !(await this.validatePassword(createUserDto.password))) {
        throw new BadRequestException('Password Minimal 8 Karakter!');
      }
      // validasi role
      if (![Role.Superadmin, Role.Admin, Role.User].includes(createUserDto.role)) {
        throw new BadRequestException('Role Tidak Valid!');
      }
      // validasi biar tidak ada email yang sama
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email:createUserDto.email,
          deleted: false,
        },
      });
      if (existingUser) {
        throw new BadRequestException('Email Sudah Tersedia!');
      }      
      try {
        const originalPassword = createUserDto.password; // Simpan password asli
        const hashPassword = await bcrypt.hash(createUserDto.password, 8);
        //create user
        const user = await this.prisma.user.create({
          data: {
            full_name: createUserDto.full_name,
            email: createUserDto.email,
            password: hashPassword,
            original_password: createUserDto.password, // Simpan password asli
            role: createUserDto.role,
            menu: createUserDto.menu,
          },          
        });
         // Transform menu sebelum mengembalikan response
        user.menu = this.transformMenu(user.menu);
        // record log
        const userEmail = this.request.user.email;
        await this.logFieldCreate({ ...user, password: originalPassword }, null, userEmail, 'Create'); //  password asli dalam log
        return user;        
      } catch (error) { 
        console.log(error);
        throw new BadRequestException('Gagal Membuat Akun!');
      }
  }    

    // RECORD LOG CREATE
    private async logFieldCreate(newData: any, oldData: any, updatedByEmail: string, action: string) {
      const fieldsToExclude = ['password', 'token', 'deleted', 'created_at', 'updated_at'];
      const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));
      for (const field of fields) {
        let newValue = newData[field];
        let oldValue = oldData?.[field];
        // Ubah struktur menu dari json menjadi string
        if (field === 'menu') {
          newValue = this.flattenMenu(newData[field]);
          oldValue = oldData ? this.flattenMenu(oldData[field]) : null;
        }
        // Handle password field separately
        if (field === 'password') {
          oldValue = null; // Pastikan oldValue untuk password adalah null saat pembuatan
        }
        // ubah format value
        const formattedOldValue = oldValue !== undefined ? this.formatValue(oldValue) : null;
        const formattedNewValue = this.formatValue(newValue);
        const formattedField = this.formatField(field);
        // logic record log
        if (formattedNewValue !== formattedOldValue) {
          await this.logService.create({
            menu_name: 'System Administrator',
            data_name: newData.user_id.toString(),
            field: formattedField,
            action: action,
            old_value: formattedOldValue,
            new_value: formattedNewValue,
            updated_by_email: updatedByEmail,
            updated_at: new Date(),
          });
        }
      }
    }      

  async validate(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { 
        email: email,
        deleted: false,
      },
    });
    if (!user) {
      throw new NotFoundException('Akun Tidak Ditemukan!');
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new BadRequestException('Password Salah!');
    }
    return user;
  }

  //fungsi untuk menyimpan token ke dalam databases
  async saveToken(userId: number, token: string): Promise<void> {
    await this.prisma.user.update({
      where: { user_id: userId },
      data: { token },
    });
  }

  async login(user: LoginUserInput) {
      // validasi untuk -> tidak perlu menambahkan field lain selain email dan password
      const addFields = Object.keys(user).filter(
        (key) => key !== 'email' && key !== 'password',
      );
      if (addFields.length > 0) {
        throw new BadRequestException();
      }
      try {
        const result = await this.validate(user.email, user.password);
        // console.log(result);
        if (result != null) {
          // ketambahan ini
          // await this.logout(result.token);
          const jwt = await this.jwtService.signAsync(
            {
              id: result.user_id,
              full_name: result.full_name,                                    
              email: result.email,
              role: result.role,    
              menu: result.menu
            },
            {
              secret: this.configService.JWT_SECRET,
              expiresIn: this.configService.JWT_EXPIRES_IN,
            },
          );
          this.blacklist.add(result.token);
          // this.blacklist.add(jwt);
          // memanggil fungsi saveToken
          await this.saveToken(result.user_id, jwt);
          // soon diganti tokennya tok aja, oke?
          return {
            id: result.user_id,
            email: result.email,
            full_name: result.full_name,
            access_token: jwt,
            role: result.role,
            menu: result.menu,
          };
        } else {
          return null;
        }
      } catch (error) {
        throw new Error('Gagal Login' + error.message);
      }
  }

  async logout(token: string): Promise<void> {
    try {
      console.log('Token logout:', token);
      const decodedToken = jwt.verify(token, this.configService.JWT_SECRET) as {
        id: number;
      };
      await this.prisma.user.update({
        where: { user_id: decodedToken.id },
        data: { token: null },
      });
      // menambahkan token ke dalam blacklist
      this.blacklist.add(token);
    } catch (error) {      
      throw new Error('Invalid Token!');
    }
  }

  // fungsi untuk memeriksa apakah token masuk ke dalam blacklist
  isTokenBlacklisted(token: string): boolean {
    return this.blacklist.has(token);
  }     
  
  async findAllUser(getUserDto: GetUserDto): Promise<any> {
    const { limit, page, search, sort_order } = getUserDto;
    const lowerCaseSearch = search ? search.toLowerCase() : '';
  
    const where: Prisma.UserWhereInput = {
      AND: [
        { deleted: false },
        search ? {
          OR: [
            { full_name: { contains: lowerCaseSearch, mode: 'insensitive' } },
            { email: { contains: lowerCaseSearch, mode: 'insensitive' } },
            ...Object.values(Role)
              .filter(role => role.toLowerCase().includes(lowerCaseSearch))
              .map(role => ({ role: { equals: role } })),
          ],
        } : {},
      ],
    };
  
    const query: Prisma.UserFindManyArgs = {
      take: limit ? parseInt(limit) : 10,
      skip: page ? (page - 1) * (limit ? parseInt(limit) : 10) : 0,
      where: where,
      orderBy: {
        created_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
      select: {
        user_id: true,
        full_name: true,
        email: true,
        role: true,
      },
    };
  
    const getUser = await this.prisma.user.findMany(query);
    const totalUsers = await this.prisma.user.count({ where: where });
    const totalPages = Math.ceil(totalUsers / (limit ? parseInt(limit) : 10));
  
    return {
      getUser,
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page.toString()) : 1,
      totalUsers,
      totalPages,
    };
  }

  async findOne(usersWhereUniqueInput: Prisma.UserWhereUniqueInput) {
    const user = await this.prisma.user.findUnique({
      where: {
        ...usersWhereUniqueInput,
        deleted: false,
      },
      select: {
        full_name: true,
        email: true,
        password: true,
        role: true,
        menu: true,        
        deleted: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User Tidak Ditemukan!');
    }    
    return user;
  }
  
  async update(where: Prisma.UserWhereUniqueInput, data: Prisma.UserUpdateInput) {
      try {
        const currentUser = await this.prisma.user.findUnique({ where });
        if (!currentUser) {
          throw new NotFoundException('Data Tidak Ditemukan!');
        }
        // jika yang diedit adalah email        
        if (data.email && !isEmail(data.email)) {
          throw new BadRequestException('Email Tidak Valid!');
        }
        // jika yang diedit adalah password
        let originalPassword = null;
        if (data.password) {
          if (typeof data.password === 'string' && data.password.length >= 8) {
            originalPassword = data.password; // Simpan password asli
            const hashPassword = await bcrypt.hash(data.password, 8);
            data.password = hashPassword;
            data.original_password = originalPassword;  // Simpan password asli
            // Hapus token pengguna dari daftar token yang sudah logout
            if (currentUser.token) {
              await this.logout(currentUser.token);
            }
          } else {
            throw new BadRequestException('Password Minimal 8 Karakter!');
          }
        }
        // cek duplikasi email
        if (data.email) {
          const existingUser = await this.prisma.user.findFirst({
            where: {
              email: data.email as Prisma.StringFilter,
              user_id: { not: currentUser.user_id }, // Pastikan pengguna yang sama tidak diperiksa
              deleted: false,
            },
          });
          if (existingUser) {
            throw new ConflictException('Email Sudah Tersedia!');
          }
        }        
        // proses edit data
        const updatedUser = await this.prisma.user.update({ where, data });        
        // record log
        const userEmail = this.request.user.email;
        const updatedData = { ...updatedUser, password: originalPassword || updatedUser.password }; // Gunakan password asli jika ada        
        await this.logFieldUpdate(updatedData, currentUser, userEmail, 'Update');
        return { message: 'Data Berhasil Diedit!', user: updatedUser };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new NotFoundException('Data Tidak Ditemukan!');
        }
        throw error;
      }
  }

    // RECORD LOG UPDATE
    private async logFieldUpdate(newData: any, oldData: any, updatedByEmail: string, action: string) {
      const fieldsToExclude = ['password', 'token', 'deleted', 'created_at', 'updated_at'];
      const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));
      for (const field of fields) {
        let oldValue = oldData?.[field];
        let newValue = newData[field];
        // Khusus untuk field 'menu', harus diperiksa perubahannya 
        if (field === 'menu') {
          if (JSON.stringify(newValue) === JSON.stringify(oldValue)) {
            // Jika tidak ada perubahan pada 'menu', abaikan dan lanjutkan ke iterasi berikutnya
            continue;
          }
          // Ubah format value
          oldValue = this.flattenMenu(oldValue);
          newValue = this.flattenMenu(newValue);
        }
        if (field === 'password') {
          oldValue = null; // Pastikan oldValue untuk password adalah null saat pembuatan
        }
        // Convert object to string without quotes
        const formattedOldValue = oldValue !== null ? this.formatValue(oldValue) : null;
        const formattedNewValue = this.formatValue(newValue);
        const formattedField = this.formatField(field);
    
        if (formattedNewValue !== formattedOldValue) {
          await this.logService.create({
            menu_name: 'System Administrator',
            data_name: newData.user_id.toString(),
            field: formattedField,
            action: action,
            old_value: formattedOldValue,
            new_value: formattedNewValue,
            updated_by_email: updatedByEmail,
            updated_at: new Date(),
          });
        }
      }
    }      

  async remove(userId: number): Promise<void> {
      try {
        // mengambil token dari ID yg mau dihapus
        const user = await this.prisma.user.findUnique({
          where: { user_id: userId},
          select: { token: true },
        });
        // memanggil metode logout
        if (user && user.token) {
          await this.logout(user.token);
        }
        // menghapus dari database        
        const deletedUser = await this.prisma.user.update({
          where: { user_id: userId },
          data: { deleted: true},
        });

        // RECORD LOG
        const userEmail = this.request.user.email;
        await this.logService.create({
          menu_name: 'System Administrator',
          data_name: userId.toString(),
          field: null,
          action: 'Delete',
          old_value: null,
          new_value: null,
          updated_by_email: userEmail,
          updated_at: new Date(),
        });

        if (!deletedUser) {
          throw new NotFoundException('Data Tidak Ditemukan!');
        }        
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new NotFoundException('Data Tidak Ditemukan!');
        }
        throw error;
      }
  }
}

