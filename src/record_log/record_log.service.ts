/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';
import { GetRecordLog } from './dto/get-record_log.dto';

@Injectable()
export class RecordLogService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.RecordLogCreateInput): Promise<void> {
    await this.prisma.recordLog.create({
      data: data,
    });
  }  
    
  async findAll(menu?: string, startDate?: string, endDate?: string, getLogDto?: GetRecordLog): Promise<any> {
    const { limit, page, search, sort_order } = getLogDto || {};
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return new Intl.DateTimeFormat('id-ID', options).format(date);
    };  
    // konversi tanggal 
    const formattedStartDate = startDate ? new Date(startDate) : undefined;
    const formattedEndDate = endDate ? new Date(endDate) : undefined;
    const decodedMenu = menu ? decodeURIComponent(menu) : undefined;

    const where: Prisma.RecordLogWhereInput = {
      AND: [        
        decodedMenu ? { menu_name: { contains: decodedMenu, mode: 'insensitive' } } : {},
        startDate ? { updated_at: { gte: formattedStartDate } } : {},
        endDate ?  { updated_at: { lte: formattedEndDate } } : {},
        search ? {
          OR: [            
            { data_name: { contains: search, mode: 'insensitive' } },
            { field: { contains: search, mode: 'insensitive' } },
            { action: { contains: search, mode: 'insensitive' } },
            { new_value: { contains: search, mode: 'insensitive' } },
            { old_value: { contains: search, mode: 'insensitive' } },
            { updated_by_email: { contains: search, mode: 'insensitive' } },            
          ]
        } : {},        
      ]
    };

    const query: Prisma.RecordLogFindManyArgs = {
      take: limit ? parseInt(limit) : 10,
      skip: page ? (page - 1) * (limit ? parseInt(limit) : 10) : 0,  
      where: where,               
      orderBy: {
        created_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
      select: {  
        log_activity_id: true,        
        menu_name: true,          
        data_name: true,
        field: true,
        action: true,
        old_value: true,
        new_value: true,
        updated_by_email: true,
        updated_at: true,
      },
    };                
    const getLog = await this.prisma.recordLog.findMany(query);
    const formattedLogs = getLog.map(log => ({
      ...log,
      updated_at: formatDate(log.updated_at.toISOString()),
    }));
    const totalData = await this.prisma.recordLog.count({
      where: where
    });
    const totalPages = Math.ceil(totalData / (limit ? parseInt(limit) : 10 ));
    return {
      getLog: formattedLogs,
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page.toString()) : 1,
      totalData,
      totalPages,      
    };
  }  
}

