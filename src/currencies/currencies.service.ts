import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CurrenciesService {
  constructor(private prismaService: PrismaService) {}

  findAll(search: string) {
    return this.prismaService.currency.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [{ name: { contains: search, mode: 'insensitive' } }],
              }
            : {},
        ],
      },
    });
  }
}
