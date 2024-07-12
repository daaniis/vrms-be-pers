/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ConflictException,  
  Inject,  
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, Template, TipeTemplate, VariableType } from '@prisma/client';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import * as fastcsv from 'fast-csv';
import { Response } from 'express';
import * as xlsx from 'xlsx';
import { GetTemplateDto } from './dto/get-template.dto';
import { REQUEST } from '@nestjs/core';
import { RecordLogService } from 'src/record_log/record_log.service';

@Injectable()
export class TemplatesService {
  constructor(
    private prisma: PrismaService,
    private logService: RecordLogService,
    @Inject(REQUEST) private readonly request: any,    
  ) {}

  // buat record log, jangan dihapus
  private flattenVariable(variable: string[]): string {
    return variable.join(', ');
  }
  
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
        return 'null';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value).replace(/"/g, '');
    }
    return String(value);
  }

  private formatField(fieldName: string): string {
    return fieldName
      .split('_') // Memisahkan kata yang dipisahkan oleh underscore
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Mengubah huruf pertama menjadi kapital
      .join(' '); // Menggabungkan kembali dengan spasi
  }
  
  async findById(templateId: number): Promise<Template> {
    return await this.prisma.template.findUnique({
      where: { template_id: templateId },
    });
  }

  async export(
    templateId: number,
    format: string,
    res: Response,
  ): Promise<void> {
    const template = await this.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    let fileName = `${template.template_name}`;
    let data;

    if (format === 'csv') {
      fileName += '.csv';
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'text/csv');

      const csvStream = fastcsv.format({ headers: true });

      csvStream.pipe(res);
      csvStream.write(Object.values(template.variable));
      csvStream.end();
    } else if (format === 'xlsx') {
      fileName += '.xlsx';
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'text/xlsx');
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet([template.variable], {
        skipHeader: true,
      });

      xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
      data = xlsx.write(wb, {
        bookType: 'xlsx',
        type: 'buffer',
      });
    } else {
      throw new Error('Invalid format. Please choose either "csv" or "xlsx"');
    }

    res.end(data);
  }

  async findManyTranslation(getTemplateDto: GetTemplateDto): Promise<any> {
    const { limit, page, search, sort_order } = getTemplateDto;

    let query: Prisma.TemplateFindManyArgs = {
      take: limit ? parseInt(limit) : 10,
      skip: page && limit ? (page - 1) * parseInt(limit) : 0,
      where: {
        template_type: TipeTemplate.TRANSLATION,
        template_name: {
          contains: search,
          mode: 'insensitive',  // Menambahkan pencarian tidak case-sensitive
        },
      },
      orderBy: {
        created_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
    };

    const templates = await this.prisma.template.findMany(query);

    const totalData = await this.prisma.template.count({
      where: {
        template_type: TipeTemplate.TRANSLATION,
        template_name: {
          contains: search,
          mode: 'insensitive',  // Menambahkan pencarian tidak case-sensitive
        },
      },
    });

    const totalPages = Math.ceil(totalData / (limit ? parseInt(limit) : 10));

    return {
      templates,
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page.toString()) : 1,
      totalData,
      totalPages,
    };
  }

  async findOneTranslation(
    templateWhereUniqueInput: Prisma.TemplateWhereUniqueInput,
  ) {
    const oneTemplate = await this.prisma.template.findUnique({
      where: {
        ...templateWhereUniqueInput,
        template_type: TipeTemplate.TRANSLATION,
      },
    });

    if (!oneTemplate) {
      throw new BadRequestException('Template not found');
    }

    return {
      template_id: oneTemplate.template_id,
      template_name: oneTemplate.template_name,
      variable: oneTemplate.variable,
      create_at: oneTemplate.created_at,
    };
  }

  async createTranslation(createTemplateDto: CreateTemplateDto) {
    const { template_name, variable } = createTemplateDto;

    // Periksa apakah template_name sudah ada
    const existingTemplate = await this.prisma.template.findFirst({
      where: {
        template_name, template_type: TipeTemplate.TRANSLATION,
      },
    });

    if (existingTemplate) {
      throw new ConflictException('Template dengan nama yang sama sudah ada');
    }

    // Periksa apakah semua variabel sudah ada dalam tabel variable
    const missingVariables = await Promise.all(
      variable.map(async (variable_name) => {
        const existingVariable = await this.prisma.variable.findFirst({
          where: { variable_name, variable_type: 'Translation' },
        });
        return existingVariable ? null : variable_name;
      }),
    );

    const missingVariablesFiltered = missingVariables.filter(
      (variable) => variable !== null,
    );

    if (missingVariablesFiltered.length > 0) {
      throw new NotFoundException(
        `Variabel (${missingVariablesFiltered.join(', ')}) tidak ditemukan dalam database`,
      );
    }

    // Memeriksa apakah ada nama variabel duplikat
    const duplicateVariable = variable.find(
      (value, index, array) => array.indexOf(value) !== index,
    );
    if (duplicateVariable) {
      throw new BadRequestException('Nama variabel tidak boleh duplikat');
    }    
    // Simpan template dan hubungkan dengan variabel yang sudah ada
    const template = await this.prisma.template.create({
      data: {
        template_name,
        template_type: TipeTemplate.TRANSLATION,
        variable,
      },
    });
    // RECORD LOG
    const userEmail = this.request.user.email;
    await this.logFieldCreateTranslation(template, null, userEmail, 'Create');
    return template;
    // return await this.prisma.template.create({
    //   data: {
    //     template_name,
    //     template_type: TipeTemplate.TRANSLATION,
    //     variable,
    //   },
    // });    
  }
  
  // RECORD LOG CREATE
  private async logFieldCreateTranslation(newData: any, oldData: any, updatedByEmail: string, action: string) {
    const fieldsToExclude = ['created_at', 'updated_at', 'template_id', 'template_type'];
    const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));      
    for (const field of fields) {
        let newValue = newData[field];
        let oldValue = oldData?.[field];
        if (field === 'variable') {
            newValue = this.flattenVariable(newData[field]);
            oldValue = oldData ? this.flattenVariable(oldData[field]) : null;
        }  
        // ubah format value
        const formattedOldValue = oldValue !== undefined ? this.formatValue(oldValue) : 'null';
        const formattedNewValue = this.formatValue(newValue);
        const formattedField = this.formatField(field);
        if (formattedNewValue !== formattedOldValue) {
            await this.logService.create({
                menu_name: 'Master Data - Variable Input Form - Translation',
                data_name: newData.template_id.toString(),
                field: formattedField,
                action: action,
                old_value: formattedOldValue === 'null' ? null : formattedOldValue,
                new_value: formattedNewValue,
                updated_by_email: updatedByEmail,
                updated_at: new Date(),
            });
        }
    }
  }

  async updateTranslation(
    template_id: number,
    updateTemplateDto: UpdateTemplateDto,
  ) {
    const { template_name, variable } = updateTemplateDto;    

    // Ambil nama template yang sedang diperbarui
    const existingTemplate = await this.prisma.template.findUnique({
      where: {
        template_id,
      },
    });

    if (!existingTemplate) {
      throw new NotFoundException('Template tidak ditemukan');
    }

    // Periksa apakah ada nama template yang sama selain template yang sedang diperbarui
    if (template_name) {
      const existingTemplateWithSameName = await this.prisma.template.findFirst(
        {
          where: {
            template_name,
            template_type: TipeTemplate.TRANSLATION,
            NOT: {
              template_id: template_id,
            },
          },
        },
      );
      if (existingTemplateWithSameName) {
        throw new ConflictException('Template dengan nama yang sama sudah ada');
      }
      if (variable) {
        if (variable && variable.length > 0) {
          const hasDuplicateVariable = variable.some(
            (value, index, array) => array.indexOf(value) !== index,
          );
          if (hasDuplicateVariable) {
            throw new BadRequestException('Nama variabel tidak boleh duplikat');
          }

          // Periksa apakah semua variabel sudah ada dalam tabel variable
          const missingVariables = await Promise.all(
            variable.map(async (variable_name) => {
              const existingVariable = await this.prisma.variable.findFirst({
                where: { variable_name, variable_type: 'Translation' },
              });
              return existingVariable ? null : variable_name;
            }),
          );

          const missingVariablesFiltered = missingVariables.filter(
            (variable) => variable !== null,
          );

          if (missingVariablesFiltered.length > 0) {
            throw new NotFoundException(
              `Variabel (${missingVariablesFiltered.join(', ')}) tidak ditemukan dalam database`,
            );
          }
        }
      }
    } else {
      if (variable) {
        // Periksa apakah ada nama variabel duplikat
        if (variable && variable.length > 0) {
          const hasDuplicateVariable = variable.some(
            (value, index, array) => array.indexOf(value) !== index,
          );
          if (hasDuplicateVariable) {
            throw new BadRequestException('Nama variabel tidak boleh duplikat');
          }

          // Periksa apakah semua variabel sudah ada dalam tabel variable
          const missingVariables = await Promise.all(
            variable.map(async (variable_name) => {
              const existingVariable = await this.prisma.variable.findFirst({
                where: { variable_name, variable_type: 'Translation' },
              });
              return existingVariable ? null : variable_name;
            }),
          );

          const missingVariablesFiltered = missingVariables.filter(
            (variable) => variable !== null,
          );

          if (missingVariablesFiltered.length > 0) {
            throw new NotFoundException(
              `Variabel (${missingVariablesFiltered.join(', ')}) tidak ditemukan dalam database`,
            );
          }
        }
      }
    }

    const updateTemplate = await this.prisma.template.update({
      where: {
        template_id,
      },
      data: {
        template_name,
        template_type: TipeTemplate.TRANSLATION,
        variable,
      }
    })        
    // RECORD LOG
    const userEmail = this.request.user.email;    
    await this.logFieldUpdateTranslation(updateTemplate, existingTemplate, userEmail, 'Update');
    return updateTemplate;        
    // return this.prisma.template.update({
    //   where: {
    //     template_id,
    //   },
    //   data: {
    //     template_name,
    //     template_type: TipeTemplate.TRANSLATION,
    //     variable,
    //   },
    // });
  }

  // RECORD LOG UPDATE
  private async logFieldUpdateTranslation(newData: any, oldData: any, updatedByEmail: string, action: string) {
    const fieldsToExclude = ['created_at', 'updated_at', 'template_id', 'template_type'];
    const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));
    for (const field of fields) {
        let newValue = newData[field];
        let oldValue = oldData ? oldData[field] : null;
        if (field === 'variable') {
            newValue = this.flattenVariable(newData[field]);
            oldValue = oldData ? this.flattenVariable(oldData[field]) : null;
        }
        const formattedOldValue = oldValue !== null ? this.formatValue(oldValue) : null;
        const formattedNewValue = this.formatValue(newValue);
        const formattedField = this.formatField(field);
        if (formattedOldValue !== formattedNewValue) {
            await this.logService.create({
                menu_name: 'Master Data - Variable Input Form - Translation',
                data_name: newData.template_id.toString(),
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

  async removeTranslation(template_id: number) {
    const template = await this.prisma.template.findUnique({
      where: {
        template_id,
        template_type: TipeTemplate.TRANSLATION,
      },
    });

    // RECORD LOG
    const userEmail = this.request.user.email;
    await this.logService.create({
      menu_name: 'Master Data - Variable Input Form - Translation',
      data_name: template_id.toString(),
      field: null,
      action: 'Delete',
      old_value: null,
      new_value: null,
      updated_by_email: userEmail,
      updated_at: new Date(),
    })

    if (!template) {
      throw new NotFoundException('Template tidak ditemukan');
    } else {
      return this.prisma.template.delete({
        where: {
          template_id,
          template_type: TipeTemplate.TRANSLATION,
        },
      });
    }    
  }

  async exportTranslation(
    template_id: number,
    format: string,
    res: Response,
  ): Promise<void> {
    const template = await this.prisma.template.findUnique({
      where: {
        template_id,
        template_type: TipeTemplate.TRANSLATION,
      },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    let fileName = `${template.template_name}`;
    let data;

    if (format === 'csv') {
      fileName += '.csv';
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'text/csv');

      const csvStream = fastcsv.format({ headers: true });

      csvStream.pipe(res);
      csvStream.write(Object.values(template.variable));
      csvStream.end();
    } else if (format === 'xlsx') {
      fileName += '.xlsx';
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'text/xlsx');

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet([template.variable], {
        skipHeader: true,
      });

      xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');

      data = xlsx.write(wb, {
        bookType: 'xlsx',
        type: 'buffer',
      });
    } else {
      throw new Error('Invalid format. Please choose either "csv" or "xlsx"');
    }

    res.end(data);
  }

  // NON TRANSLATION
  async findManyNonTranslation(getTemplateDto: GetTemplateDto): Promise<any> {
    const { limit, page, search, sort_order } = getTemplateDto;

    let query: Prisma.TemplateFindManyArgs = {
      take: page ? parseInt(limit) : 10,
      skip: page && limit ? (page - 1) * parseInt(limit) : 0,
      where: {
        template_type: TipeTemplate.NON_TRANSLATION,
        template_name: {
          contains: search,
          mode: 'insensitive',  // Menambahkan pencarian tidak case-sensitive
        },
      },
      orderBy: {
        created_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
    };

    const templates = await this.prisma.template.findMany(query);

    const totalData = await this.prisma.template.count({
      where: {
        template_type: TipeTemplate.NON_TRANSLATION,
        template_name: {
          contains: search,
          mode: 'insensitive',  // Menambahkan pencarian tidak case-sensitive
        },
      },
    });

    const totalPages = Math.ceil(totalData / (limit ? parseInt(limit) : 10));

    return {
      templates,
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page.toString()) : 1,
      totalData,
      totalPages,
    };
  }

  async findOneNonTranslation(
    templateWhereUniqueInput: Prisma.TemplateWhereUniqueInput,
  ) {
    const oneTemplate = await this.prisma.template.findUnique({
      where: {
        ...templateWhereUniqueInput,
        template_type: TipeTemplate.NON_TRANSLATION,
      },
    });

    if (!oneTemplate) {
      throw new BadRequestException('Template not found');
    }

    return {
      template_id: oneTemplate.template_id,
      template_name: oneTemplate.template_name,
      variable: oneTemplate.variable,
      create_at: oneTemplate.created_at,
    };
  }

  async createNonTranslation(createTemplateDto: CreateTemplateDto) {
    const { template_name, variable } = createTemplateDto;

    // Periksa apakah template_name sudah ada
    const existingTemplate = await this.prisma.template.findFirst({
      where: {
        template_name,
        template_type: TipeTemplate.NON_TRANSLATION,
      },
    });

    if (existingTemplate) {
      throw new ConflictException('Template dengan nama yang sama sudah ada');
    }

    // Periksa apakah semua variabel sudah ada dalam tabel variable
    const missingVariables = await Promise.all(
      variable.map(async (variable_name) => {
        const existingVariable = await this.prisma.variable.findFirst({
          where: { variable_name, variable_type: 'NonTranslation' },
        });
        return existingVariable ? null : variable_name;
      }),
    );

    const missingVariablesFiltered = missingVariables.filter(
      (variable) => variable !== null,
    );

    if (missingVariablesFiltered.length > 0) {
      throw new NotFoundException(
        `Variabel (${missingVariablesFiltered.join(', ')}) tidak ditemukan dalam database`,
      );
    }

    // Memeriksa apakah ada nama variabel duplikat
    const duplicateVariable = variable.find(
      (value, index, array) => array.indexOf(value) !== index,
    );
    if (duplicateVariable) {
      throw new BadRequestException('Nama variabel tidak boleh duplikat');
    }

    // Simpan template dan hubungkan dengan variabel yang sudah ada
    const templateNon =  await this.prisma.template.create({
      data: {
        template_name,
        template_type: TipeTemplate.NON_TRANSLATION,
        variable,
      },
    });
    // RECORD LOG
    const userEmail = this.request.user.email;
    await this.logFieldCreateNonTranslation(templateNon, null, userEmail, 'Create');
    return templateNon;
  }

  // RECORD LOG CREATE
  private async logFieldCreateNonTranslation(newData: any, oldData: any, updatedByEmail: string, action: string) {
    const fieldsToExclude = ['created_at', 'updated_at', 'template_id', 'template_type'];
    const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));      
    for (const field of fields) {
        let newValue = newData[field];
        let oldValue = oldData?.[field];
        if (field === 'variable') {
            newValue = this.flattenVariable(newData[field]);
            oldValue = oldData ? this.flattenVariable(oldData[field]) : null;
        }  
        // ubah format value
        const formattedOldValue = oldValue !== undefined ? this.formatValue(oldValue) : 'null';
        const formattedNewValue = this.formatValue(newValue);
        const formattedField = this.formatField(field);
        if (formattedNewValue !== formattedOldValue) {
            await this.logService.create({
                menu_name: 'Master Data - Variable Input Form - Non Translation',
                data_name: newData.template_id.toString(),
                field: formattedField,
                action: action,
                old_value: formattedOldValue === 'null' ? null : formattedOldValue,
                new_value: formattedNewValue,
                updated_by_email: updatedByEmail,
                updated_at: new Date(),
            });
        }
    }
  }

  async updateNonTranslation(
    template_id: number,
    updateTemplateDto: UpdateTemplateDto,
  ) {
    const { template_name, variable } = updateTemplateDto;

    // Ambil nama template yang sedang diperbarui
    const existingTemplate = await this.prisma.template.findUnique({
      where: {
        template_id,
      },
    });

    if (!existingTemplate) {
      throw new NotFoundException('Template tidak ditemukan');
    }

    // Periksa apakah ada nama template yang sama selain template yang sedang diperbarui
    if (template_name) {
      const existingTemplateWithSameName = await this.prisma.template.findFirst(
        {
          where: {
            template_name,
            template_type: TipeTemplate.NON_TRANSLATION,
            NOT: {
              template_id: template_id,
            },
          },
        },
      );
      if (existingTemplateWithSameName) {
        throw new ConflictException('Template dengan nama yang sama sudah ada');
      }
      if (variable) {
        if (variable && variable.length > 0) {
          const hasDuplicateVariable = variable.some(
            (value, index, array) => array.indexOf(value) !== index,
          );
          if (hasDuplicateVariable) {
            throw new BadRequestException('Nama variabel tidak boleh duplikat');
          }

          // Periksa apakah semua variabel sudah ada dalam tabel variable
          const missingVariables = await Promise.all(
            variable.map(async (variable_name) => {
              const existingVariable = await this.prisma.variable.findFirst({
                where: { variable_name, variable_type: 'NonTranslation' },
              });
              return existingVariable ? null : variable_name;
            }),
          );

          const missingVariablesFiltered = missingVariables.filter(
            (variable) => variable !== null,
          );

          if (missingVariablesFiltered.length > 0) {
            throw new NotFoundException(
              `Variabel (${missingVariablesFiltered.join(', ')}) tidak ditemukan dalam database`,
            );
          }
        }
      }
    } else {
      if (variable) {
        // Periksa apakah ada nama variabel duplikat
        if (variable && variable.length > 0) {
          const hasDuplicateVariable = variable.some(
            (value, index, array) => array.indexOf(value) !== index,
          );
          if (hasDuplicateVariable) {
            throw new BadRequestException('Nama variabel tidak boleh duplikat');
          }

          // Periksa apakah semua variabel sudah ada dalam tabel variable
          const missingVariables = await Promise.all(
            variable.map(async (variable_name) => {
              const existingVariable = await this.prisma.variable.findFirst({
                where: { variable_name, variable_type: 'NonTranslation' },
              });
              return existingVariable ? null : variable_name;
            }),
          );

          const missingVariablesFiltered = missingVariables.filter(
            (variable) => variable !== null,
          );

          if (missingVariablesFiltered.length > 0) {
            throw new NotFoundException(
              `Variabel (${missingVariablesFiltered.join(', ')}) tidak ditemukan dalam database`,
            );
          }
        }
      }
    }

    const updateTemplateNon = await this.prisma.template.update({
      where: {
        template_id,
      },
      data: {
        template_name,
        template_type: TipeTemplate.NON_TRANSLATION,
        variable,
      },
    });
    // RECORD LOG
    const userEmail = this.request.user.email;    
    await this.logFieldUpdateNonTranslation(updateTemplateNon, existingTemplate, userEmail, 'Update');
    return updateTemplateNon;
  }

  // RECORD LOG UPDATE
  private async logFieldUpdateNonTranslation(newData: any, oldData: any, updatedByEmail: string, action: string) {
    const fieldsToExclude = ['created_at', 'updated_at', 'template_id', 'template_type'];
    const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));
    for (const field of fields) {
        let newValue = newData[field];
        let oldValue = oldData ? oldData[field] : null;
        if (field === 'variable') {
            newValue = this.flattenVariable(newData[field]);
            oldValue = oldData ? this.flattenVariable(oldData[field]) : null;
        }
        const formattedOldValue = oldValue !== null ? this.formatValue(oldValue) : null;
        const formattedNewValue = this.formatValue(newValue);
        const formattedField = this.formatField(field);
        if (formattedOldValue !== formattedNewValue) {
            await this.logService.create({
                menu_name: 'Master Data - Variable Input Form - Non Translation',
                data_name: newData.template_id.toString(),
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

  async removeNonTranslation(template_id: number) {
    const template = await this.prisma.template.findUnique({
      where: {
        template_id,
        template_type: TipeTemplate.NON_TRANSLATION,
      },
    });
    // RECORD LOG
    const userEmail = this.request.user.email;
    await this.logService.create({
      menu_name: 'Master Data - Variable Input Form - Non Translation',
      data_name: template_id.toString(),
      field: null,
      action: 'Delete',
      old_value: null,
      new_value: null,
      updated_by_email: userEmail,
      updated_at: new Date(),
    })
    if (!template) {
      throw new NotFoundException('Template tidak ditemukan');
    } else {
      return this.prisma.template.delete({
        where: {
          template_id,
          template_type: TipeTemplate.NON_TRANSLATION,
        },
      });
    }
  }

  async exportNonTranslation(
    template_id: number,
    format: string,
    res: Response,
  ): Promise<void> {
    const template = await this.prisma.template.findUnique({
      where: {
        template_id,
        template_type: TipeTemplate.NON_TRANSLATION,
      },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    let fileName = `${template.template_name}`;
    let data;

    if (format === 'csv') {
      fileName += '.csv';
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'text/csv');

      const csvStream = fastcsv.format({ headers: true });

      csvStream.pipe(res);
      csvStream.write(Object.values(template.variable));
      csvStream.end();
    } else if (format === 'xlsx') {
      fileName += '.xlsx';
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'text/xlsx');

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet([template.variable], {
        skipHeader: true,
      });

      xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');

      data = xlsx.write(wb, {
        bookType: 'xlsx',
        type: 'buffer',
      });
    } else {
      throw new Error('Invalid format. Please choose either "csv" or "xlsx"');
    }

    res.end(data);
  }

  // VENDOR
  async findManyVendor(getTemplateDto: GetTemplateDto): Promise<any> {
    const { limit, page, search, sort_order } = getTemplateDto;

    let query: Prisma.TemplateFindManyArgs = {
      take: page ? parseInt(limit) : 10,
      skip: page && limit ? (page - 1) * parseInt(limit) : 0,
      where: {
        template_type: TipeTemplate.VENDOR,
        template_name: {
          contains: search,
          mode: 'insensitive',  // Menambahkan pencarian tidak case-sensitive
        },
      },
      orderBy: {
        created_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
    };

    const templates = await this.prisma.template.findMany(query);

    const totalData = await this.prisma.template.count({
      where: {
        template_type: TipeTemplate.VENDOR,
        template_name: {
          contains: search,
          mode: 'insensitive',  // Menambahkan pencarian tidak case-sensitive
        },
      },
    });

    const totalPages = Math.ceil(totalData / (limit ? parseInt(limit) : 10));

    return {
      templates,
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page.toString()) : 1,
      totalData,
      totalPages,
    };
  }

  async findOneVendor(
    templateWhereUniqueInput: Prisma.TemplateWhereUniqueInput,
  ) {
    const oneTemplate = await this.prisma.template.findUnique({
      where: {
        ...templateWhereUniqueInput,
        template_type: TipeTemplate.VENDOR,
      },
    });

    if (!oneTemplate) {
      throw new BadRequestException('Template not found');
    }

    return {
      template_id: oneTemplate.template_id,
      template_name: oneTemplate.template_name,
      variable: oneTemplate.variable,
      create_at: oneTemplate.created_at,
    };
  }

  async createVendor(createTemplateDto: CreateTemplateDto) {
    const { template_name, variable } = createTemplateDto;

    // Periksa apakah template_name sudah ada
    const existingTemplate = await this.prisma.template.findFirst({
      where: {
        template_name,
        template_type: TipeTemplate.VENDOR,
      },
    });

    if (existingTemplate) {
      throw new ConflictException('Template dengan nama yang sama sudah ada');
    }

    // Periksa apakah semua variabel sudah ada dalam tabel variable
    const missingVariables = await Promise.all(
      variable.map(async (variable_name) => {
        const existingVariable = await this.prisma.variable.findFirst({
          where: { variable_name, variable_type: 'Vendor' },
        });
        return existingVariable ? null : variable_name;
      }),
    );

    const missingVariablesFiltered = missingVariables.filter(
      (variable) => variable !== null,
    );

    if (missingVariablesFiltered.length > 0) {
      throw new NotFoundException(
        `Variabel (${missingVariablesFiltered.join(', ')}) tidak ditemukan dalam database`,
      );
    }

    // Memeriksa apakah ada nama variabel duplikat
    const duplicateVariable = variable.find(
      (value, index, array) => array.indexOf(value) !== index,
    );
    if (duplicateVariable) {
      throw new BadRequestException('Nama variabel tidak boleh duplikat');
    }

    // Simpan template dan hubungkan dengan variabel yang sudah ada
    const templateVendor = await this.prisma.template.create({
      data: {
        template_name,
        template_type: TipeTemplate.VENDOR,
        variable,
      },
    });
    // RECORD LOG
    const userEmail = this.request.user.email;
    await this.logFieldCreateVendor(templateVendor, null, userEmail, 'Create');
    return templateVendor;
  }

  // RECORD LOG CREATE
  private async logFieldCreateVendor(newData: any, oldData: any, updatedByEmail: string, action: string) {
    const fieldsToExclude = ['created_at', 'updated_at', 'template_id', 'template_type'];
    const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));      
    for (const field of fields) {
        let newValue = newData[field];
        let oldValue = oldData?.[field];
        if (field === 'variable') {
            newValue = this.flattenVariable(newData[field]);
            oldValue = oldData ? this.flattenVariable(oldData[field]) : null;
        }  
        // ubah format value
        const formattedOldValue = oldValue !== undefined ? this.formatValue(oldValue) : 'null';
        const formattedNewValue = this.formatValue(newValue);
        const formattedField = this.formatField(field);
        if (formattedNewValue !== formattedOldValue) {
            await this.logService.create({
                menu_name: 'Master Data - Variable Input Form - Vendor',
                data_name: newData.template_id.toString(),
                field: formattedField,
                action: action,
                old_value: formattedOldValue === 'null' ? null : formattedOldValue,
                new_value: formattedNewValue,
                updated_by_email: updatedByEmail,
                updated_at: new Date(),
            });
        }
    }
  }

  async updateVendor(
    template_id: number,
    updateTemplateDto: UpdateTemplateDto,
  ) {
    const { template_name, variable } = updateTemplateDto;

    // Ambil nama template yang sedang diperbarui
    const existingTemplate = await this.prisma.template.findUnique({
      where: {
        template_id,
      },
    });

    if (!existingTemplate) {
      throw new NotFoundException('Template tidak ditemukan');
    }

    // Periksa apakah ada nama template yang sama selain template yang sedang diperbarui
    if (template_name) {
      const existingTemplateWithSameName = await this.prisma.template.findFirst(
        {
          where: {
            template_name,
            template_type: TipeTemplate.VENDOR,
            NOT: {
              template_id: template_id,
            },
          },
        },
      );
      if (existingTemplateWithSameName) {
        throw new ConflictException('Template dengan nama yang sama sudah ada');
      }
      if (variable) {
        if (variable && variable.length > 0) {
          const hasDuplicateVariable = variable.some(
            (value, index, array) => array.indexOf(value) !== index,
          );
          if (hasDuplicateVariable) {
            throw new BadRequestException('Nama variabel tidak boleh duplikat');
          }

          // Periksa apakah semua variabel sudah ada dalam tabel variable
          const missingVariables = await Promise.all(
            variable.map(async (variable_name) => {
              const existingVariable = await this.prisma.variable.findFirst({
                where: { variable_name, variable_type: 'Vendor' },
              });
              return existingVariable ? null : variable_name;
            }),
          );

          const missingVariablesFiltered = missingVariables.filter(
            (variable) => variable !== null,
          );

          if (missingVariablesFiltered.length > 0) {
            throw new NotFoundException(
              `Variabel (${missingVariablesFiltered.join(', ')}) tidak ditemukan dalam database`,
            );
          }
        }
      }
    } else {
      if (variable) {
        // Periksa apakah ada nama variabel duplikat
        if (variable && variable.length > 0) {
          const hasDuplicateVariable = variable.some(
            (value, index, array) => array.indexOf(value) !== index,
          );
          if (hasDuplicateVariable) {
            throw new BadRequestException('Nama variabel tidak boleh duplika');
          }

          // Periksa apakah semua variabel sudah ada dalam tabel variable
          const missingVariables = await Promise.all(
            variable.map(async (variable_name) => {
              const existingVariable = await this.prisma.variable.findFirst({
                where: { variable_name, variable_type: 'Vendor' },
              });
              return existingVariable ? null : variable_name;
            }),
          );

          const missingVariablesFiltered = missingVariables.filter(
            (variable) => variable !== null,
          );

          if (missingVariablesFiltered.length > 0) {
            throw new NotFoundException(
              `Variabel (${missingVariablesFiltered.join(', ')}) tidak ditemukan dalam database`,
            );
          }
        }
      }
    }

    const updateVendor = await this.prisma.template.update({
      where: {
        template_id,
      },
      data: {
        template_name,
        template_type: TipeTemplate.VENDOR,
        variable,
      },
    });    
    if (!existingTemplate) {
      throw new NotFoundException('Template tidak ditemukan!');
    }
    // RECORD LOG 
    const userEmail = this.request.user.email;    
    await this.logFieldUpdateVendor(updateVendor, existingTemplate, userEmail, 'Update');
    return updateVendor;
  }
  
  // RECORD LOG UPDATE 
  private async logFieldUpdateVendor(newData: any, oldData: any, updatedByEmail: string, action: string) {
    const fieldsToExclude = ['created_at', 'updated_at', 'template_id', 'template_type'];
    const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));
    for (const field of fields) {
        let newValue = newData[field];
        let oldValue = oldData ? oldData[field] : null;
        if (field === 'variable') {
            newValue = this.flattenVariable(newData[field]);
            oldValue = oldData ? this.flattenVariable(oldData[field]) : null;
        }
        const formattedOldValue = oldValue !== null ? this.formatValue(oldValue) : null;
        const formattedNewValue = this.formatValue(newValue);
        const formattedField = this.formatField(field);
        if (formattedOldValue !== formattedNewValue) {
            await this.logService.create({
                menu_name: 'Master Data - Variable Input Form - Vendor',
                data_name: newData.template_id.toString(),
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

  async removeVendor(template_id: number) {
    const template = await this.prisma.template.findUnique({
      where: {
        template_id,
        template_type: TipeTemplate.VENDOR,
      },
    });
    
    // RECORD LOG
    const userEmail = this.request.user.email;
    await this.logService.create({
      menu_name: 'Master Data - Variable Input Form - Vendor',
      data_name: template_id.toString(),
      field: null,
      action: 'Delete',
      old_value: null,
      new_value: null,
      updated_by_email: userEmail,
      updated_at: new Date(),
    })

    if (!template) {
      throw new NotFoundException('Template tidak ditemukan');
    } else {
      return this.prisma.template.delete({
        where: {
          template_id,
          template_type: TipeTemplate.VENDOR,
        },
      });
    }
  }

  async exportVendor(
    template_id: number,
    format: string,
    res: Response,
  ): Promise<void> {
    const template = await this.prisma.template.findUnique({
      where: {
        template_id,
        template_type: TipeTemplate.VENDOR,
      },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    let fileName = `${template.template_name}`;
    let data;

    if (format === 'csv') {
      fileName += '.csv';
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'text/csv');

      const csvStream = fastcsv.format({ headers: true });

      csvStream.pipe(res);
      csvStream.write(Object.values(template.variable));
      csvStream.end();
    } else if (format === 'xlsx') {
      fileName += '.xlsx';
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'text/xlsx');

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet([template.variable], {
        skipHeader: true,
      });

      xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');

      data = xlsx.write(wb, {
        bookType: 'xlsx',
        type: 'buffer',
      });
    } else {
      throw new Error('Invalid format. Please choose either "csv" or "xlsx"');
    }

    res.end(data);
  }
}
