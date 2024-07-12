/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';
import { validate } from 'class-validator';
import { GetRateTypeDto } from './dto/get-rate_type.dto';
import { RecordLogService } from 'src/record_log/record_log.service';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class RateTypeService {
  constructor(
    private prisma: PrismaService,
    private logService: RecordLogService,
    @Inject(REQUEST) private readonly request: any,
  ) {}

  // untuk record log, jangan dihapus
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
        return 'null';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value).replace(/"/g, '');
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

  async create(rateTypeCreateInput: Prisma.RateTypeCreateInput) {
    if (!rateTypeCreateInput.rate_type_name) {
      throw new BadRequestException('Rate Type Name harus diisi');
    }

    // Cek apakah RateTypes dengan nama yang sama sudah ada
    const existingRateType = await this.prisma.rateType.findFirst({
      where: {
        rate_type_name: {
          equals: rateTypeCreateInput.rate_type_name,
          mode: 'insensitive', // Mengaktifkan mode case-insensitive
        },
        deleted: false,
      },
    });

    if (existingRateType) {
      throw new BadRequestException(
        'Rate Types dengan nama yang sama sudah ada',
      );
    }

    // Validasi menggunakan class-validator
    const errors = await validate(rateTypeCreateInput);
    if (errors.length > 0) {
      throw new BadRequestException('Data yang dimasukkan tidak valid');
    }

    try {
      const newrateType = await this.prisma.rateType.create({
        data: {
          rate_type_name: rateTypeCreateInput.rate_type_name,
        },
      });
      // record log
      const userEmail = this.request.user.email;
      await this.logFieldCreate(newrateType, null, userEmail, 'Create');
      return newrateType;
    } catch (error) {
      throw new BadRequestException('Gagal Menambahkan Rate Type!');
    }
  }

  // RECORD LOG CREATE
  private async logFieldCreate(newData: any, oldData: any, updatedByEmail: string, action: string) {
    const fieldsToExclude = ['rate_type_id','deleted', 'created_at', 'updated_at'];
    const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));      
    for (const field of fields) {
      const formattedField = this.formatField(field);
        if (newData[field] !== oldData?.[field]) {
            await this.logService.create({
                menu_name: 'Master Data - Rate Type',
                data_name: newData.rate_type_id.toString(),
                field: formattedField,
                action: action,
                old_value: oldData ? this.formatValue(oldData[field]) : null,
                new_value: this.formatValue(newData[field]),
                updated_by_email: updatedByEmail,
                updated_at: new Date(),
            });
        }
    }
  }

  // get all
  async findAll(getRateTypeDto: GetRateTypeDto): Promise<any> {
    const { limit, page, search, sort_order } = getRateTypeDto;

    let query: Prisma.RateTypeFindManyArgs = {
      take: limit ? parseInt(limit) : 10,
      skip: page && limit ? (page - 1) * parseInt(limit) : 0,
      where: {
        deleted: false,
        rate_type_name: {
          contains: search,
          mode: 'insensitive',  // Menambahkan pencarian tidak case-sensitive
        },
      },
      orderBy: {
        created_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
    };

    const rateTypes = await this.prisma.rateType.findMany(query);

    const totalData = await this.prisma.rateType.count({
      where: {
        deleted: false,
        rate_type_name: {
          contains: search,
          mode: 'insensitive',  // Menambahkan pencarian tidak case-sensitive
        },
      },
    });

    const totalPages = Math.ceil(totalData / (limit ? parseInt(limit) : 10));

    return {
      rateTypes,
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page.toString()) : 1,
      totalData,
      totalPages,
    };
  }

  // select all after soft delete
  async selectAll(getRateTypeDto: GetRateTypeDto): Promise<any> {
    const { sort_order, search } = getRateTypeDto;

    let query: Prisma.RateTypeFindManyArgs = {
      where: {
        deleted: false,
        rate_type_name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      orderBy: {
        created_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
      select: {
        rate_type_id: true,
        rate_type_name: true,
      },
    };

    const rateTypes = await this.prisma.rateType.findMany(query);

    return {
      rateTypes
    };
  }

  async findOne(rateTypeWhereUniqueInput: Prisma.RateTypeWhereUniqueInput) {
    const oneRateType = await this.prisma.rateType.findUnique({
      where: rateTypeWhereUniqueInput,
    });
    if (!oneRateType) {
      throw new NotFoundException('Rate Type Tidak Ditemukan!');
    }

    return oneRateType;
  }

  async update(
    where: Prisma.RateTypeWhereUniqueInput,
    data: Prisma.RateTypeUpdateInput,
  ) {
    // mengambil data terbaru
    const currentRateType = await this.prisma.rateType.findUnique({where});
    if (!currentRateType) {
      throw new NotFoundException('Data Tidak Ditemukan!');
    }
    // Cek apakah ada data yang akan diperbarui
    if (!data.rate_type_name) {
      throw new BadRequestException('Rate Type Name harus diisi');
    }

    // cek duplikasi rate_type_name
    // Cek duplikasi rate_type_name
    if (data.rate_type_name) {
      const rateTypeNameLowerCase = (data.rate_type_name as string).toLowerCase();

      const existingRateTypes = await this.prisma.rateType.findMany({
        where: {
          NOT: {
            rate_type_id: where.rate_type_id,
          },
          deleted: false,
        },
      });

      const duplicateRateType = existingRateTypes.find(
        rate_type => rate_type.rate_type_name.toLowerCase() === rateTypeNameLowerCase,
      );

      if (duplicateRateType) {
        throw new ConflictException('Rate Type dengan nama yang sama sudah ada!');
      }
    }

    // Lakukan pembaruan jika valid
    const updatedRateType = await this.prisma.rateType.update({
      data,
      where,
    });
    // record log
    const userEmail = this.request.user.email;
    await this.logFieldUpdate(updatedRateType, currentRateType, userEmail, 'Update');
    return updatedRateType;
  }

  // RECORD LOG UPDATE
  private async logFieldUpdate(newData: any, oldData: any, updatedByEmail: string, action: string) {
    const fieldsToExclude = ['rate_type_id', 'created_at', 'updated_at'];
    const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));

    for (const field of fields) {
      const formattedField = this.formatField(field);
        if (newData[field] !== oldData?.[field]) {
            await this.logService.create({
                menu_name: 'Master Data - Rate Type',
                data_name: newData.rate_type_id.toString(),
                field: formattedField,
                action: action,
                old_value: oldData ? this.formatValue(oldData[field]) : null,
                new_value: this.formatValue(newData[field]),
                updated_by_email: updatedByEmail,
                updated_at: new Date(),
            });
        }
    }
  }

  // async remove(where: Prisma.RateTypeWhereUniqueInput) {
  //   try {
  //     const deletedRateType = await this.prisma.rateType.delete({
  //       where,
  //     });
  //     if(!deletedRateType) {
  //       throw new NotFoundException('Data Tidak Ditemukan!')
  //     };
  //   } catch (error) {
  //     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
  //       throw new NotFoundException('Data Tidak Ditemukan!');
  //     }
  //     throw error;
  //   }
  // }

  async softDelete(rateTypeId: number): Promise<void> {
    const existingRateType = await this.prisma.rateType.findUnique({
      where: { rate_type_id: rateTypeId },
    });
    if (!existingRateType) {
      throw new NotFoundException('Rate Type tidak ditemukan!');
    }

    try {
      await this.prisma.rateType.update({
        where: { rate_type_id: rateTypeId },
        data: { deleted: true },
      });
      // RECORD LOG
      const userEmail = this.request.user.email;
      await this.logService.create({
        menu_name: 'Master Data - Rate Type',
        data_name: rateTypeId.toString(),
        field: null,
        action: 'Delete',
        old_value: null,
        new_value: null,
        updated_by_email: userEmail,
        updated_at: new Date(),
      });
    } catch (error) {
      throw new BadRequestException('Gagal menghapus rate type!');
    }
  }
}
