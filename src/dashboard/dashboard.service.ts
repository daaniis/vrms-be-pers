import { Injectable } from '@nestjs/common';
import { TypeFreelance } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prismaService: PrismaService) {}

  async count() {
    const currentMonth = new Date().getMonth() + 1; // Get current month (1-12)
    const currentYear = new Date().getFullYear();

    const totalVendors = await this.prismaService.vendor.count({
      where: {
        created_at: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1),
        },
      },
    });

    const totalTranslation = await this.prismaService.freelance.count({
      where: {
        type_freelance: TypeFreelance.Translation,
        created_at: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1),
        },
      },
    });

    const totalNonTranslation = await this.prismaService.freelance.count({
      where: {
        type_freelance: TypeFreelance.NonTranslation,
        created_at: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1),
        },
      },
    });

    return {
      total_vendors: totalVendors,
      total_translation: totalTranslation,
      total_nontranslation: totalNonTranslation,
    };
  }

  async graph() {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Retrieve data from vendor table
    const vendorData = await this.prismaService.vendor.findMany({
      where: {
        created_at: {
          gte: new Date(previousYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      select: {
        created_at: true,
      },
    });

    // Retrieve data from freelance table
    const freelanceData = await this.prismaService.freelance.findMany({
      where: {
        created_at: {
          gte: new Date(previousYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
      select: {
        type_freelance: true,
        created_at: true,
      },
    });

    const years = {
      [currentYear]: {
        vendor: Array(12).fill(0),
        translation: Array(12).fill(0),
        nonTranslation: Array(12).fill(0),
      },
      [previousYear]: {
        vendor: Array(12).fill(0),
        translation: Array(12).fill(0),
        nonTranslation: Array(12).fill(0),
      },
    };

    // Process vendor data
    vendorData.forEach((item) => {
      const year = item.created_at.getFullYear();
      const month = item.created_at.getMonth();
      years[year].vendor[month]++;
    });

    // Process freelance data
    freelanceData.forEach((item) => {
      const year = item.created_at.getFullYear();
      const month = item.created_at.getMonth();
      if (item.type_freelance === TypeFreelance.Translation) {
        years[year].translation[month]++;
      } else if (item.type_freelance === TypeFreelance.NonTranslation) {
        years[year].nonTranslation[month]++;
      }
    });

    return { years };
  }
}
