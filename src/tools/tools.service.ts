/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { validate } from 'class-validator';
import { GetToolDto } from './dto/get-tool.dto';
import { RecordLogService } from 'src/record_log/record_log.service';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class ToolsService {
  constructor(
    private prisma: PrismaService,
    private logService: RecordLogService,
    @Inject(REQUEST) private readonly requset: any,
  ) {}

  // untuk record log, jangan dihapus
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value).replace(/"/g, ''); // Menghilangkan tanda petik
    }
    return String(value);
  }  

  private formatField(fieldName: string): string {
    return fieldName
      .split('_') // Memisahkan kata yang dipisahkan oleh underscore
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Mengubah huruf pertama menjadi kapital
      .join(' '); // Menggabungkan kembali dengan spasi
  }

  // add Tools
  async create(toolCreateInput: Prisma.ToolCreateInput) {
    if (!toolCreateInput.tool_name) {
      throw new BadRequestException('Nama Tool harus diisi');
    }

    // Cek apakah Tools dengan nama yang sama sudah ada
    const existingTool = await this.prisma.tool.findFirst({
      where: {
        tool_name: {
          equals: toolCreateInput.tool_name,
          mode: 'insensitive', // Mengaktifkan mode case-insensitive
        },
        deleted: false,
      },
    });

    if (existingTool) {
      throw new BadRequestException('Tools dengan nama yang sama sudah ada');
    }

    // Validasi menggunakan class-validator
    const errors = await validate(toolCreateInput);
    if (errors.length > 0) {
      throw new BadRequestException('Data yang dimasukkan tidak valid');
    }

    try {
      const newTool = await this.prisma.tool.create({
        data: {
          tool_name: toolCreateInput.tool_name,
        },
      });
      // record log
      const userEmail = this.requset.user.email;
      await this.logFieldCreate(newTool, null, userEmail, 'Create');
      return newTool;
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Gagal Menambahkan Tool!');
    }
  }

  // RECORD LOG CREATE
  private async logFieldCreate(newData: any, oldData: any, updatedByEmail: string, action: string) {
    const fieldsToExclude = ['tool_id', 'deleted', 'created_at', 'updated_at'];
    const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));      
    for (const field of fields) {
      const formattedField = this.formatField(field);
      if (newData[field] !== oldData?.[field]) {
        await this.logService.create({
          menu_name: 'Master Data - Tool',
          data_name: newData.tool_id.toString(),
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

  // find all after soft delete
  async findAll(getToolDto: GetToolDto): Promise<any> {
    const { limit, page, search, sort_order } = getToolDto;
    let query: Prisma.ToolFindManyArgs = {
      take: limit ? parseInt(limit) : 10,
      skip: page && limit ? (page - 1) * parseInt(limit) : 0,
      where: {
        deleted: false,
        tool_name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      orderBy: {
        created_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
    };
    const tools = await this.prisma.tool.findMany(query);
    const totalData = await this.prisma.tool.count({
      where: {
        deleted: false,
        tool_name: {
          contains: search,
          mode: 'insensitive',
        },
      },
    });
    const totalPages = Math.ceil(totalData / (limit ? parseInt(limit) : 10));
    return {
      tools,
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page.toString()) : 1,
      totalData,
      totalPages,
    };
  }

  // select all after soft delete
  async selectAll(getToolDto: GetToolDto): Promise<any> {
    const { sort_order, search } = getToolDto;

    let query: Prisma.ToolFindManyArgs = {
      where: {
        deleted: false,
        tool_name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      orderBy: {
        created_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
      select: {
        tool_id: true,
        tool_name: true,
      },
    };
    const tools = await this.prisma.tool.findMany(query);
    return {
      tools
    };
  }

  // get 1 tool
  async findOne(toolWhereUniqueInput: Prisma.ToolWhereUniqueInput) {
    const oneTool = await this.prisma.tool.findUnique({
      where: toolWhereUniqueInput,
    });

    if (!oneTool) {
      throw new NotFoundException('Tool Tidak Ditemukan!');
    }

    return oneTool;
  }

  // update tool
  async update(
    where: Prisma.ToolWhereUniqueInput,
    data: Prisma.ToolUpdateInput,
  ) {
    // Cek apakah tool yang ingin diupdate ada
    const existingTool = await this.prisma.tool.findUnique({
      where,
    });
    if (!existingTool) {
      throw new NotFoundException('Tool tidak ditemukan!');
    }

    // Cek duplikasi tool_name
    if (data.tool_name) {
      const toolNameLowerCase = (data.tool_name as string).toLowerCase();

      const existingTools = await this.prisma.tool.findMany({
        where: {
          NOT: {
            tool_id: where.tool_id,
          },
          deleted: false,
        },
      });

      const duplicateTool = existingTools.find(
        tool => tool.tool_name.toLowerCase() === toolNameLowerCase,
      );

      if (duplicateTool) {
        throw new ConflictException('Tool dengan nama yang sama sudah ada!');
      }
    }

    const updatedTool = await this.prisma.tool.update({
      data,
      where,
    });
    // record log
    const userEmail = this.requset.user.email;
    await this.logFieldUpdate(updatedTool, existingTool, userEmail, 'Update');
    return updatedTool;
  }

  // RECORD LOG UPDATE
  private async logFieldUpdate(newData: any, oldData: any, updatedByEmail: string, action: string) {
    const fieldsToExclude = ['tool_id', 'deleted', 'created_at', 'updated_at'];
    const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));
  
    for (const field of fields) {
      if (newData[field] !== oldData?.[field]) {
        const formattedField = this.formatField(field);
        await this.logService.create({
          menu_name: 'Master Data - Tool',
          data_name: newData.tool_id.toString(),
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

  // soft delete
  async softDelete(toolId: number): Promise<void> {
    const existingTool = await this.prisma.tool.findUnique({
      where: { tool_id: toolId },
    });
    if (!existingTool) {
      throw new NotFoundException('Tool tidak ditemukan!');
    }

    try {
      await this.prisma.tool.update({
        where: { tool_id: toolId },
        data: { deleted: true },
      });
       // RECORD LOG
        const userEmail = this.requset.user.email;
        await this.logService.create({
          menu_name: 'Master Data - Tools',
          data_name: toolId.toString(),
          field: null,
          action: 'Delete',
          old_value: null,
          new_value: null,
          updated_by_email: userEmail,
          updated_at: new Date(),
        })
    } catch (error) {
      throw new BadRequestException('Gagal menghapus tool!');
    }   
  }
}
