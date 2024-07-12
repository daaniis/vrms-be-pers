/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { VariableType } from '@prisma/client';
@Injectable()
export class VariablesService {
  constructor(private prisma: PrismaService) {}
  async findAllTranslation() {
    const variable = await this.prisma.variable.findMany({
      where: {
        variable_type: VariableType.Translation,
      },
    });
    return variable;
  }

  async findAllNonTranslation() {
    const variable = await this.prisma.variable.findMany({
      where: {
        variable_type: VariableType.NonTranslation,
      },
    });
    return variable;
  }

  async findAllVendor() {
    const variable = await this.prisma.variable.findMany({
      where: {
        variable_type: VariableType.Vendor,
      },
    });
    return variable;
  }
}
