import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CountriesService {
  constructor(private prismaService: PrismaService) {}

  findAll(search: string) {
    return this.prismaService.country.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [{ name: { contains: search, mode: 'insensitive' } }],
              }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  findStatesByCountry(country_id: string, search: string) {
    return this.prismaService.state.findMany({
      where: {
        AND: [
          { country_id: parseInt(country_id) },
          search
            ? {
                OR: [{ name: { contains: search, mode: 'insensitive' } }],
              }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  findCitiesByState(country_id: string, state_id: string, search: string) {
    return this.prismaService.city.findMany({
      where: {
        AND: [
          { country_id: parseInt(country_id) },
          { state_id: parseInt(state_id) },
          search
            ? {
                OR: [{ name: { contains: search, mode: 'insensitive' } }],
              }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });
  }
}
