import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LanguagesService {
  constructor(private prismaService: PrismaService) {}

  findAll(search: string) {
    return this.prismaService.language.findMany({
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
