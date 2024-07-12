/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GetAllDto } from './dto/get-all.dto';
import {
  Prisma,
  StatusApproval,
  TypeFreelance,
  TypeResource,
} from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
import { CreateTranslationDto } from './dto/create-freelance.dto';
import { UpdateTranslationDto } from './dto/update-freelance.dto';
import * as fastcsv from 'fast-csv';
import * as xlsx from 'xlsx';
import { RecordLogService } from 'src/record_log/record_log.service';
import { REQUEST } from '@nestjs/core';
import { IsEmail, validate } from 'class-validator';

@Injectable()
class FreelancerEmailValidation {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  constructor(email: string) {
    this.email = email;
  }
}

export class TranslationService {
  constructor(
    private prismaService: PrismaService,
    private logService: RecordLogService,
    @Inject(REQUEST) private readonly request: any,
  ) {}

  // buat record log
  private formatListRate(listRate: any[]): string {
    return listRate
      .map(
        (rate) =>
          `id: ${rate.id}, rate: ${rate.rate}, calc_unit: ${rate.calc_unit}, rate_type_id: ${rate.rate_type_id}, type_of_service: ${rate.type_of_service}`,
      )
      .join('\n');
  }

  // buat record log
  private formatTools(tools: string[]): string {
    return tools.join(', ');
  }

  // buat record log
  private formatValue(value: string): string {
    if (typeof value === 'string') {
      return value.replace(/^"|"$/g, '');
    }
    return value;
  }

  // buat record log
  private formatField(fieldName: string): string {
    return fieldName
      .split('_') // Memisahkan kata yang dipisahkan oleh underscore
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Mengubah huruf pertama menjadi kapital
      .join(' '); // Menggabungkan kembali dengan spasi
  }

  // Fungsi untuk mendapatkan ID Freelance selanjutnya
  async getNextFreelanceId() {
    const lastFreelancer = await this.prismaService.freelance.findFirst({
      orderBy: { username: 'desc' },
    });

    if (!lastFreelancer) {
      return 1;
    }

    const lastFreelancerId = parseInt(lastFreelancer.username.slice(2), 10);
    return lastFreelancerId + 1;
  }

  private pad(number: number, size: number) {
    let result = number.toString();
    while (result.length < size) {
      result = '0' + result;
    }
    return result;
  }

  async createTranslation(createTranslationDto: CreateTranslationDto) {
    const mandatoryFields = [
      'full_name',
      'whatsapp',
      'nickname',
      'email',
      'language_from_id',
      'language_to_id',
      'specialization_on',
      'tools',
      'country_id',
      'state_id',
      'city_id',
      'district',
      'postal_code',
    ];

    const missingFields = mandatoryFields.filter(
      (field) => !createTranslationDto[field],
    );

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `The following fields are missing or invalid: ${missingFields.join(', ')}`,
      );
    }

    const existingEmail = await this.prismaService.freelance.findFirst({
      where: {
        email: createTranslationDto.email,
        type_freelance: TypeFreelance.Translation,
        deleted: false,
      },
    });

    if (existingEmail) {
      throw new ConflictException('Email dengan nama yang sama sudah ada');
    }

    const language_from_id = Number(createTranslationDto.language_from_id);
    const language_to_id = Number(createTranslationDto.language_to_id);
    const country_id = Number(createTranslationDto.country_id);
    const state_id = Number(createTranslationDto.state_id);
    const city_id = Number(createTranslationDto.city_id);
    const currency_id = createTranslationDto.currency_id
      ? Number(createTranslationDto.currency_id)
      : null;
    const tools = createTranslationDto.tools;
    let list_rate = createTranslationDto.list_rate;

    if (language_from_id === language_to_id) {
      throw new BadRequestException(
        'language_from_id dan language_to_id tidak boleh sama',
      );
    }

    // Validate state_id
    const state = await this.prismaService.state.findFirst({
      where: {
        id: state_id,
        country_id: country_id,
      },
    });

    if (!state) {
      throw new BadRequestException(
        'Invalid state_id for the selected country_id',
      );
    }

    // Validate city_id
    const city = await this.prismaService.city.findFirst({
      where: {
        id: city_id,
        state: {
          country_id: country_id,
        },
      },
    });

    if (!city) {
      throw new BadRequestException(
        'Invalid city_id for the selected state_id and country_id',
      );
    }

    // Validate tools
    if (tools && tools.length > 0) {
      const existingToolNames = (
        await this.prismaService.tool.findMany({
          where: {
            tool_name: { in: tools as string[] },
          },
          select: {
            tool_name: true,
          },
        })
      ).map((tool) => tool.tool_name);

      const missingTools = tools.filter(
        (tool) => !existingToolNames.includes(tool),
      );

      if (missingTools.length > 0) {
        throw new BadRequestException(
          `Tool(s) '${missingTools.join(', ')}' tidak ada`,
        );
      }
    }

    // Validate list_rate
    list_rate = list_rate
      .map((rate) => {
        const validRate = {
          type_of_service: rate.type_of_service ?? null,
          rate: rate.rate ?? null,
          rate_type_id: rate.rate_type_id ?? null,
          calc_unit: rate.calc_unit ?? null,
        };

        const hasNonNullAttribute = Object.values(validRate).some(
          (value) => value !== null,
        );

        return hasNonNullAttribute ? { ...validRate } : null;
      })
      .filter((rate) => rate !== null);

    let nextId = await this.getNextFreelanceId();
    let freelanceId = `FL${this.pad(nextId, 3)}`;

    // Memeriksa keunikan freelanceId
    let isUnique = false;
    while (!isUnique) {
      const existingFreelance = await this.prismaService.freelance.findFirst({
        where: { username: freelanceId },
      });
      if (!existingFreelance) {
        isUnique = true;
      } else {
        nextId++; // Menambah nextId agar freelanceId berikutnya berbeda
        freelanceId = `FL${this.pad(nextId, 3)}`;
      }
    }

    // Convert empty strings to null
    const convertEmptyStringToNull = (value: any) =>
      value === '' ? null : value;

    try {
      const createdFreelance = await this.prismaService.freelance.create({
        data: {
          username: freelanceId,
          full_name: createTranslationDto.full_name,
          whatsapp: createTranslationDto.whatsapp,
          nickname: createTranslationDto.nickname,
          email: createTranslationDto.email,
          specialization_on: createTranslationDto.specialization_on,
          tools: tools,
          district: createTranslationDto.district,
          postal_code: createTranslationDto.postal_code,
          full_address: convertEmptyStringToNull(
            createTranslationDto.full_address,
          ),
          bank_name: convertEmptyStringToNull(createTranslationDto.bank_name),
          branch_office: convertEmptyStringToNull(
            createTranslationDto.branch_office,
          ),
          account_holder_name: convertEmptyStringToNull(
            createTranslationDto.account_holder_name,
          ),
          account_number: convertEmptyStringToNull(
            createTranslationDto.account_number,
          ),
          name_tax: convertEmptyStringToNull(createTranslationDto.name_tax),
          resource_status: convertEmptyStringToNull(
            createTranslationDto.resource_status,
          ),
          npwp_number: convertEmptyStringToNull(
            createTranslationDto.npwp_number,
          ),
          language_from_id: language_from_id,
          language_to_id: language_to_id,
          country_id: country_id,
          state_id: state_id,
          city_id: city_id,
          currency_id: currency_id,
          type_freelance: TypeFreelance.Translation,
          attachments: [],
          list_rate: list_rate as unknown as Prisma.JsonArray,
        },
      });
      // RECORD LOG
      const userEmail = this.request.user.email;
      await this.logFieldCreate(createdFreelance, null, userEmail, 'Create');
      return createdFreelance;
    } catch (error) {
      console.error('Error occurred during freelance creation:', error.message);
      throw new InternalServerErrorException('Failed to create freelance');
    }
  }

  // RECORD LOG CREATE
  private async logFieldCreate(
    newData: any,
    oldData: any,
    updatedByEmail: string,
    action: string,
  ) {
    const fieldsToExclude = [
      'freelance_id',
      'attachments',
      'deleted',
      'created_at',
      'updated_at',
    ];
    const fields = Object.keys(newData).filter(
      (field) => !fieldsToExclude.includes(field),
    );
    for (const field of fields) {
      let newValue = this.formatValue(JSON.stringify(newData[field]));
      let oldValue = oldData
        ? this.formatValue(JSON.stringify(oldData[field]))
        : null;

      if (field === 'list_rate') {
        newValue = this.formatListRate(newData[field]);
        oldValue = oldData ? this.formatListRate(oldData[field]) : null;
      } else if (field === 'tools') {
        newValue = this.formatTools(newData[field]);
        oldValue = oldData ? this.formatTools(oldData[field]) : null;
      }

      const formattedField = this.formatField(field);

      if (newData[field] !== oldData?.[field]) {
        await this.logService.create({
          menu_name: 'Resource Manager - Translation',
          data_name: newData.freelance_id.toString(),
          field: formattedField,
          action: action,
          old_value: oldValue,
          new_value: newValue,
          updated_by_email: updatedByEmail,
          updated_at: new Date(),
        });
      }
    }
  }

  async importTranslation(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json<any>(worksheet);

    const mandatoryFields = [
      'Full Name',
      'Whatsapp',
      'Nickname',
      'Email',
      'Language From',
      'Language To',
      'Specialization On',
      'Tools',
      'Country',
      'Province',
      'City',
      'District',
      'Postal Code',
    ];

    let nextId = await this.getNextFreelanceId();
    const freelancersMap = new Map<string, any>();

    let successCount = 0;
    let failureCount = 0;
    let previousEmail = null;

    for (const entry of jsonData) {
      const missingFields = mandatoryFields.filter((field) => !entry[field]);

      const {
        'Full Name': full_name,
        Whatsapp,
        Nickname,
        Email,
        'Language From': language_from,
        'Language To': language_to,
        'Specialization On': specialization_on,
        Tools,
        Country,
        Province: State,
        City,
        District,
        'Postal Code': postal_code,
        'Full Address': full_address,
        Currency,
        'Type of Service': type_of_service,
        Rate,
        'Rate Type': rate_type,
        'Calculation Unit': calc_unit,
        Bank,
        'Account Holder Name': account_holder_name,
        'Account Number': account_number,
        'Branch Office of Bank': branch_office,
        'Resource Status': resource_status,
        'NPWP Number': npwp_number,
        'Tax Type': name_tax,
      } = entry;

      try {
        if (missingFields.length > 0 && previousEmail) {
          // Jika hanya memiliki informasi rate
          if (type_of_service && Rate && rate_type && calc_unit) {
            const rateTypeRecord = await this.prismaService.rateType.findFirst({
              where: {
                rate_type_name: { contains: rate_type, mode: 'insensitive' },
              },
            });

            if (!rateTypeRecord) {
              throw new NotFoundException(
                `Rate type ${rate_type} tidak ditemukan.`,
              );
            }

            const freelancer = freelancersMap.get(previousEmail);
            freelancer.list_rate.push({
              type_of_service,
              rate: Number(Rate),
              rate_type_id: rateTypeRecord.rate_type_id,
              calc_unit,
            });
          }
        } else {
          if (Email) {
            previousEmail = Email; // Simpan email sebagai referensi untuk baris berikutnya

            const emailValidation = new FreelancerEmailValidation(Email);
            const errors = await validate(emailValidation);
            if (errors.length > 0) {
              throw new BadRequestException('Invalid email address: ' + Email);
            }

            if (!freelancersMap.has(Email)) {
              freelancersMap.set(Email, {
                full_name,
                Whatsapp,
                Nickname,
                Email,
                language_from,
                language_to,
                specialization_on,
                Tools,
                Country,
                State,
                City,
                District,
                postal_code,
                full_address,
                Currency,
                list_rate: [],
                Bank,
                account_holder_name,
                account_number,
                branch_office,
                resource_status,
                npwp_number,
                name_tax,
              });
            }

            if (type_of_service && Rate && rate_type && calc_unit) {
              const rateTypeRecord =
                await this.prismaService.rateType.findFirst({
                  where: {
                    rate_type_name: {
                      contains: rate_type,
                      mode: 'insensitive',
                    },
                  },
                });

              if (!rateTypeRecord) {
                throw new NotFoundException(
                  `Rate type ${rate_type} tidak ditemukan.`,
                );
              }

              const freelancer = freelancersMap.get(Email);
              freelancer.list_rate.push({
                type_of_service,
                rate: Number(Rate),
                rate_type_id: rateTypeRecord.rate_type_id,
                calc_unit,
              });
            }
          }
        }
      } catch (error) {
        console.log(`Error occurred during data preparation: ${error.message}`);
        failureCount++;
      }
    }

    for (const [key, entry] of freelancersMap.entries()) {
      let isUnique = false;
      let freelanceId;
      while (!isUnique) {
        freelanceId = `FL${this.pad(nextId, 3)}`;
        const existingFreelance = await this.prismaService.freelance.findFirst({
          where: { username: freelanceId },
        });
        if (!existingFreelance) {
          isUnique = true;
        } else {
          nextId++;
        }
      }

      try {
        const {
          full_name,
          Whatsapp,
          Nickname,
          Email,
          language_from,
          language_to,
          specialization_on,
          Tools,
          Country,
          State,
          City,
          District,
          postal_code,
          full_address,
          Currency,
          list_rate,
          Bank,
          account_holder_name,
          account_number,
          branch_office,
          resource_status,
          npwp_number,
          name_tax,
        } = entry;

        const emailExists = await this.prismaService.freelance.findFirst({
          where: {
            email: Email,
            type_freelance: TypeFreelance.Translation,
            deleted: false,
          },
        });

        if (emailExists) {
          throw new ConflictException(
            `Email ${Email} sudah terdaftar pada freelancer lain.`,
          );
        }

        const countryRecord = await this.prismaService.country.findFirst({
          where: {
            name: { contains: Country, mode: 'insensitive' },
          },
        });

        if (!countryRecord) {
          throw new NotFoundException(`Country ${Country} tidak ditemukan.`);
        }

        const stateRecord = await this.prismaService.state.findFirst({
          where: {
            AND: [
              { country_id: countryRecord.id },
              { name: { contains: State, mode: 'insensitive' } },
            ],
          },
        });

        if (!stateRecord) {
          throw new NotFoundException(
            `State ${State} tidak ditemukan dalam country ${Country}.`,
          );
        }

        const cityRecord = await this.prismaService.city.findFirst({
          where: {
            AND: [
              { country_id: countryRecord.id },
              { state_id: stateRecord.id },
              { name: { contains: City, mode: 'insensitive' } },
            ],
          },
        });

        if (!cityRecord) {
          throw new NotFoundException(
            `City ${City} tidak ditemukan dalam state ${State} dan/atau country ${Country}.`,
          );
        }

        const languageFromRecord = await this.prismaService.language.findFirst({
          where: {
            name: { contains: language_from, mode: 'insensitive' },
          },
        });

        if (!languageFromRecord) {
          throw new NotFoundException(
            `Bahasa ${language_from} tidak ditemukan.`,
          );
        }

        const languageToRecord = await this.prismaService.language.findFirst({
          where: {
            name: { contains: language_to, mode: 'insensitive' },
          },
        });

        if (!languageToRecord) {
          throw new NotFoundException(`Bahasa ${language_to} tidak ditemukan.`);
        }

        let currencyRecord = null;
        if (Currency) {
          currencyRecord = await this.prismaService.currency.findFirst({
            where: {
              name: { contains: Currency, mode: 'insensitive' },
            },
          });

          if (!currencyRecord) {
            throw new NotFoundException(
              `Mata uang ${Currency} tidak ditemukan.`,
            );
          }
        }

        list_rate.forEach((rate) => {
          if (
            typeof rate.rate !== 'number' ||
            typeof rate.rate_type_id !== 'number' ||
            typeof rate.calc_unit !== 'string' ||
            typeof rate.type_of_service !== 'string'
          ) {
            throw new BadRequestException(
              'Invalid rate, rate_type_id, or calc_unit in list_rate',
            );
          }
        });

        await this.prismaService.freelance.create({
          data: {
            username: freelanceId,
            full_name,
            whatsapp: Whatsapp.toString(),
            nickname: Nickname,
            email: Email,
            language_from_id: languageFromRecord.id,
            language_to_id: languageToRecord.id,
            specialization_on,
            tools: Tools
              ? Tools.split(',').map((tool: string) => tool.trim())
              : [],
            country_id: countryRecord.id,
            state_id: stateRecord.id,
            city_id: cityRecord.id,
            district: District,
            postal_code: postal_code.toString(),
            full_address,
            bank_name: Bank,
            branch_office,
            account_holder_name,
            account_number: account_number ? account_number.toString() : null,
            name_tax,
            resource_status,
            npwp_number: npwp_number ? npwp_number.toString() : null,
            currency_id: currencyRecord ? currencyRecord.id : null,
            type_freelance: TypeFreelance.Translation,
            attachments: [],
            list_rate: list_rate,
          },
        });

        successCount++;
      } catch (error) {
        console.log(`Error occurred during import: ${error.message}`);
        failureCount++;
      }
    }

    return {
      message: `${successCount} data successfully added, ${failureCount} data failed`,
    };
  }

  async exportTranslation(format: string, res: Response) {
    const freelances = await this.prismaService.freelance.findMany({
      where: {
        type_freelance: TypeFreelance.Translation,
        deleted: false,
      },
      include: {
        language_from: true,
        language_to: true,
        country: true,
        state: true,
        city: true,
        currency: true,
      },
    });

    // Load all rate types
    const rateTypes = await this.prismaService.rateType.findMany();
    const rateTypeMap = rateTypes.reduce((acc, rateType) => {
      acc[rateType.rate_type_id] = rateType.rate_type_name; // Ensure to use correct fields
      return acc;
    }, {});

    // Flattening the data
    const exportData = [];

    freelances.forEach((freelance) => {
      const { list_rate, tools, ...rest } = freelance;

      // Ensure list_rate is parsed correctly
      let parsedListRate = [];
      if (typeof list_rate === 'string') {
        parsedListRate = JSON.parse(list_rate);
      } else if (Array.isArray(list_rate)) {
        parsedListRate = list_rate;
      }

      // Convert tools from JSON array to comma-separated string
      const formattedTools = Array.isArray(tools) ? tools.join(', ') : '';

      if (parsedListRate.length > 0) {
        parsedListRate.forEach((rateDetail, index) => {
          exportData.push({
            Username: index === 0 ? rest.username : '',
            'Full Name': index === 0 ? rest.full_name : '',
            Whatsapp: index === 0 ? rest.whatsapp : '',
            Nickname: index === 0 ? rest.nickname : '',
            Email: index === 0 ? rest.email : '',
            'Language From':
              index === 0 ? freelance.language_from?.name || '' : '',
            'Language To': index === 0 ? freelance.language_to?.name || '' : '',
            'Specialization On': index === 0 ? rest.specialization_on : '',
            Tools: index === 0 ? formattedTools : '',
            Country: index === 0 ? freelance.country?.name || '' : '',
            Province: index === 0 ? freelance.state?.name || '' : '',
            City: index === 0 ? freelance.city?.name || '' : '',
            District: index === 0 ? rest.district : '',
            'Postal Code': index === 0 ? rest.postal_code : '',
            'Full Address': index === 0 ? rest.full_address : '',
            Currency: index === 0 ? freelance.currency?.name || '' : '',
            'Type of Service': rateDetail.type_of_service,
            Rate: rateDetail.rate,
            'Rate Type': rateTypeMap[rateDetail.rate_type_id] || '',
            'Calculation Unit': rateDetail.calc_unit,
            Bank: index === 0 ? rest.bank_name : '',
            'Account Holder Name': index === 0 ? rest.account_holder_name : '',
            'Account Number': index === 0 ? rest.account_number : '',
            'Branch Office of Bank': index === 0 ? rest.branch_office : '',
            'Resource Status': index === 0 ? rest.resource_status : '',
            'NPWP Number': index === 0 ? rest.npwp_number : '',
            'Tax Type': index === 0 ? rest.name_tax : '',
          });
        });
      } else {
        exportData.push({
          Username: freelance.username,
          'Full Name': freelance.full_name,
          Whatsapp: freelance.whatsapp,
          Nickname: freelance.nickname,
          Email: freelance.email,
          'Language From': freelance.language_from?.name || '',
          'Language To': freelance.language_to?.name || '',
          'Specialization On': freelance.specialization_on,
          Tools: formattedTools,
          Country: freelance.country?.name || '',
          Province: freelance.state?.name || '',
          City: freelance.city?.name || '',
          District: freelance.district,
          'Postal Code': freelance.postal_code,
          'Full Address': freelance.full_address,
          Currency: freelance.currency?.name || '',
          'Type of Service': '',
          Rate: '',
          'Rate Type': '',
          'Calculation Unit': '',
          Bank: freelance.bank_name,
          'Account Holder Name': freelance.account_holder_name,
          'Account Number': freelance.account_number,
          'Branch Office of Bank': freelance.branch_office,
          'Resource Status': freelance.resource_status,
          'NPWP Number': freelance.npwp_number,
          'Tax Type': freelance.name_tax,
        });
      }
    });

    let fileName = `freelance-translation-${new Date().toISOString()}`;
    let data;

    if (format === 'csv') {
      fileName += '.csv';
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'text/csv');

      const csvStream = fastcsv.format({ headers: true });

      csvStream.pipe(res);
      exportData.forEach((freelance) => {
        csvStream.write(freelance);
      });
      csvStream.end();
    } else if (format === 'xlsx') {
      fileName += '.xlsx';
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(exportData);

      // Adjust column widths
      const colWidths = Object.keys(exportData[0]).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...exportData.map((row) =>
            row[key] ? row[key].toString().length : 0,
          ),
        );
        return { wch: maxLength + 2 }; // Adding extra space for padding
      });

      ws['!cols'] = colWidths;

      xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');

      data = xlsx.write(wb, {
        bookType: 'xlsx',
        type: 'buffer',
      });
      res.end(data);
    } else {
      throw new Error('Invalid format. Please choose either "csv" or "xlsx"');
    }
  }

  async findAllTranslation(getTranslationDto: GetAllDto) {
    const { limit, page, search, sort_order } = getTranslationDto;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return new Intl.DateTimeFormat('id-ID', options).format(date);
    };

    let query: Prisma.FreelanceFindManyArgs = {
      where: {
        type_freelance: TypeFreelance.Translation,
        deleted: false,
      },
      orderBy: {
        updated_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
      include: {
        country: true,
        state: true,
        city: true,
        currency: true,
      },
    };

    const freelances: any[] =
      await this.prismaService.freelance.findMany(query);

    // Transformasi data
    const modifiedFreelances: any[] = await Promise.all(
      freelances.map(async (freelance) => {
        const {
          freelance_id,
          username,
          full_name,
          whatsapp,
          email,
          created_at,
        } = freelance;

        // Menghitung rata-rata rating untuk setiap freelance_id
        const averageRating = await this.prismaService.submitRating.groupBy({
          by: ['freelance_id'],
          _avg: { rating: true },
          where: { freelance_id: freelance_id },
        });

        const avgRating =
          averageRating.length > 0
            ? parseFloat((averageRating[0]._avg.rating || 0).toFixed(1))
            : 0;

        return {
          freelance_id,
          username,
          full_name,
          email,
          whatsapp,
          average_rating: avgRating,
          created_at: formatDate(created_at),
        };
      }),
    );

    const filteredNote = search
      ? modifiedFreelances.filter(
          (ratings) =>
            ratings.username.toLowerCase().includes(search.toLowerCase()) ||
            ratings.full_name.toLowerCase().includes(search.toLowerCase()) ||
            ratings.whatsapp.toLowerCase().includes(search.toLowerCase()) ||
            ratings.email.toLowerCase().includes(search.toLowerCase()) ||
            ratings.created_at.toLowerCase().includes(search.toLowerCase()),
        )
      : modifiedFreelances;

    const totalData = filteredNote.length;
    const pageIndex = page ? parseInt(page.toString()) : 1;
    const pageSize = limit ? parseInt(limit) : 10;
    const paginatedRatings = filteredNote.slice(
      (pageIndex - 1) * pageSize,
      pageIndex * pageSize,
    );

    const totalPages = Math.ceil(totalData / pageSize);

    return {
      resource: paginatedRatings,
      limit: pageSize,
      page: pageIndex,
      totalData,
      totalPages,
    };
  }

  async findOneTranslation(
    freelanceWhereUniqueInput: Prisma.FreelanceWhereUniqueInput,
  ) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: {
        ...freelanceWhereUniqueInput,
        type_freelance: TypeFreelance.Translation,
      },
      include: {
        language_from: true,
        language_to: true,
        country: true,
        state: true,
        city: true,
        currency: true,
      },
    });

    if (!freelance || freelance.type_freelance !== TypeFreelance.Translation) {
      return null;
    }

    // Fetch all rate types
    const rateTypes = await this.prismaService.rateType.findMany();
    const rateTypeMap = rateTypes.reduce((acc, rateType) => {
      acc[rateType.rate_type_id] = rateType.rate_type_name;
      return acc;
    }, {});

    // Map list_rate to include rate_type_name
    const list_rate = (
      freelance.list_rate as unknown as {
        rate: number;
        rate_type_id: number;
        calc_unit: string;
      }[]
    ).map((rate) => ({
      ...rate,
      rate_type_name: rateTypeMap[rate.rate_type_id],
    }));

    const {
      country,
      state,
      city,
      language_from,
      language_to,
      currency,
      freelance_id,
      full_name,
      username,
      whatsapp,
      nickname,
      email,
      specialization_on,
      tools,
      district,
      postal_code,
      full_address,
      bank_name,
      branch_office,
      account_holder_name,
      account_number,
      name_tax,
      resource_status,
      npwp_number,
      attachments,
    } = freelance;

    return {
      freelance: {
        freelance_id,
        username,
        full_name,
        whatsapp,
        nickname,
        email,
        specialization_on,
        tools,
        district,
        postal_code,
        full_address,
        bank_name,
        branch_office,
        account_holder_name,
        account_number,
        name_tax,
        resource_status,
        npwp_number,
        language_from_id: language_from.id,
        language_from_name: language_from.name,
        language_from_code: language_from.code,
        language_to_id: language_to.id,
        language_to_name: language_to.name,
        language_to_code: language_to.code,
        country_id: country.id,
        country_name: country.name,
        country_iso2: country.iso2,
        country_iso3: country.iso3,
        country_region: country.region,
        country_subregion: country.subregion,
        state_id: state.id,
        state_name: state.name,
        state_code: state.state_code,
        city_id: city.id,
        city_name: city.name,
        currency_id: currency ? currency.id : null,
        currency_name: currency ? currency.name : null,
        currency_code: currency ? currency.code : null,
        attachments,
        list_rate,
      },
    };
  }

  async updateTranslation(
    freelance_id: string,
    updateTranslationDto: UpdateTranslationDto,
  ) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: {
        freelance_id: freelance_id,
        type_freelance: TypeFreelance.Translation,
      },
    });
    if (!freelance) {
      throw new NotFoundException('Freelance not found');
    }

    // Cek apakah language_from_id dan language_to_id sama
    if (
      'language_from_id' in updateTranslationDto &&
      'language_to_id' in updateTranslationDto
    ) {
      if (
        updateTranslationDto.language_from_id ===
        updateTranslationDto.language_to_id
      ) {
        throw new BadRequestException(
          'language_from_id dan language_to_id tidak boleh sama',
        );
      }
    }

    // Validasi state_id
    if ('state_id' in updateTranslationDto) {
      const countryId = updateTranslationDto.country_id ?? freelance.country_id;
      const stateExists = await this.prismaService.state.findFirst({
        where: {
          id: updateTranslationDto.state_id,
          country_id: countryId,
        },
      });
      if (!stateExists) {
        throw new BadRequestException(
          'State ID tidak valid untuk negara yang dipilih',
        );
      }
    }

    // Validasi city_id
    if ('city_id' in updateTranslationDto) {
      const countryId = updateTranslationDto.country_id ?? freelance.country_id;
      const cityExists = await this.prismaService.city.findFirst({
        where: {
          id: updateTranslationDto.city_id,
          state: {
            country_id: countryId,
          },
        },
      });
      if (!cityExists) {
        throw new BadRequestException(
          'City ID tidak valid untuk negara yang dipilih',
        );
      }
    }

    // Validasi tools
    if (
      'tools' in updateTranslationDto &&
      Array.isArray(updateTranslationDto.tools)
    ) {
      const toolsExist = await this.prismaService.tool.findMany({
        where: {
          tool_name: { in: updateTranslationDto.tools as string[] },
        },
      });
      if (toolsExist.length !== updateTranslationDto.tools.length) {
        throw new BadRequestException('One or more tools provided are invalid');
      }
    }

    // Handle list_rate if it exists
    let updatedListRate = undefined;
    if ('list_rate' in updateTranslationDto) {
      const list_rate = updateTranslationDto.list_rate;

      // Validate list_rate
      for (const rate of list_rate) {
        if (
          typeof rate.rate !== 'number' ||
          typeof rate.rate_type_id !== 'number' ||
          typeof rate.calc_unit !== 'string' ||
          typeof rate.type_of_service !== 'string'
        ) {
          throw new BadRequestException(
            'Invalid rate, rate_type_id, or calc_unit in list_rate',
          );
        }
      }

      // Add autoincrement ID to each list_rate item
      updatedListRate = list_rate.map((rate) => ({
        ...rate,
      }));
    }

    // Convert empty strings to null
    const sanitizedData = {};
    for (const key in updateTranslationDto) {
      if (updateTranslationDto.hasOwnProperty(key)) {
        sanitizedData[key] =
          updateTranslationDto[key] === '' ? null : updateTranslationDto[key];
      }
    }

    const updateData = {
      ...sanitizedData,
      ...(updatedListRate && {
        list_rate: updatedListRate as unknown as Prisma.JsonArray,
      }),
    };

    const updatedTranslation = await this.prismaService.freelance.update({
      where: { freelance_id: freelance_id },
      data: updateData,
    });
    // record log
    const userEmail = this.request.user.email;
    await this.logFieldUpdate(
      updatedTranslation,
      freelance,
      userEmail,
      'Update',
    );
    return updatedTranslation;
  }

  // RECORD LOG UPDATE
  private async logFieldUpdate(
    newData: any,
    oldData: any,
    updatedByEmail: string,
    action: string,
  ) {
    const fieldsToExclude = [
      'freelance_id',
      'deleted',
      'attachments',
      'created_at',
      'updated_at',
    ];
    const fields = Object.keys(newData).filter(
      (field) => !fieldsToExclude.includes(field),
    );

    for (const field of fields) {
      let newValue = this.formatValue(JSON.stringify(newData[field]));
      let oldValue = oldData
        ? this.formatValue(JSON.stringify(oldData[field]))
        : null;

      if (field === 'list_rate') {
        newValue = this.formatListRate(newData[field]);
        oldValue = oldData ? this.formatListRate(oldData[field]) : null;
      } else if (field === 'tools') {
        newValue = this.formatTools(newData[field]);
        oldValue = oldData ? this.formatTools(oldData[field]) : null;
      }

      const formattedField = this.formatField(field);

      if (newValue !== oldValue) {
        await this.logService.create({
          menu_name: 'Resource Manager - Translation',
          data_name: newData.freelance_id.toString(),
          field: formattedField,
          action: action,
          old_value: oldValue,
          new_value: newValue,
          updated_by_email: updatedByEmail,
          updated_at: new Date(),
        });
      }
    }
  }

  async removeTranslation(
    freelanceWhereUniqueInput: Prisma.FreelanceWhereUniqueInput,
  ) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: {
        ...freelanceWhereUniqueInput,
        type_freelance: TypeFreelance.Translation,
      },
    });
    if (!freelance) {
      throw new NotFoundException('Freelance not found');
    }
    try {
      await this.prismaService.freelance.update({
        where: freelanceWhereUniqueInput,
        data: {
          deleted: true,
        },
      });
      // RECORD LOG
      const userEmail = this.request.user.email;
      const dataName = freelanceWhereUniqueInput.freelance_id
        ? freelanceWhereUniqueInput.freelance_id.toString()
        : Object.values(freelanceWhereUniqueInput).toString();
      await this.logService.create({
        menu_name: 'Resource Manager - Translation',
        data_name: dataName,
        field: null,
        action: 'Delete',
        old_value: null,
        new_value: null,
        updated_by_email: userEmail,
        updated_at: new Date(),
      });
    } catch (error) {
      throw new BadRequestException('failed to delete');
    }
  }

  async getAttachmentsTranslation(
    freelance_id: string,
    page: number,
    limit: number,
  ) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: {
        freelance_id,
        type_freelance: TypeFreelance.Translation,
      },
    });

    if (!freelance) {
      throw new NotFoundException('Freelance not found');
    }

    const allAttachments = Array.isArray(freelance.attachments)
      ? freelance.attachments
      : [];

    // Calculate pagination details
    const totalAttachments = allAttachments.length;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalAttachments);

    // Slice the attachments array to get the paginated result
    const attachments = allAttachments.slice(startIndex, endIndex);

    return {
      attachments,
      limit: Number(limit),
      page: Number(page),
      totalData: totalAttachments,
      totalPages: Math.ceil(totalAttachments / limit),
    };
  }

  async uploadAttachmentTranslation(freelance_id: string, newFile: object[]) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: {
        freelance_id,
        type_freelance: TypeFreelance.Translation,
      },
    });

    if (!freelance) {
      throw new NotFoundException(
        'Freelance not found or is not a Translation.',
      );
    }

    // Tentukan file lama yang sudah ada dalam data rating
    const existingFiles: string[] = (freelance.attachments as string[]) || [];

    // Gabungkan file lama dengan file baru
    const updatedFiles = [...existingFiles, ...newFile];

    // Lakukan pembaruan pada submitRating
    const updateData: Prisma.FreelanceUpdateInput = {
      attachments: updatedFiles,
    };

    return this.prismaService.freelance.update({
      where: {
        freelance_id,
      },
      data: updateData,
    });
  }

  async downloadAttachmentNameTranslation(
    freelance_id: string,
    attachment_name: string,
    res: Response,
  ) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: {
        freelance_id,
        type_freelance: TypeFreelance.Translation,
      },
    });

    if (!freelance) {
      throw new NotFoundException('Freelance not found');
    }

    // Convert to array if it's not already an array
    const files = Array.isArray(freelance.attachments)
      ? freelance.attachments
      : JSON.parse(freelance.attachments as unknown as string);

    const file = files.find((file) => file.filename === attachment_name);

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    const filePath = path.join(
      __dirname,
      '../../..',
      'storage/attachment',
      file.filename,
    );

    return res.download(filePath, file.originalname);
  }

  async deleteAttachmentTranslation(
    freelance_id: string,
    attachment_name: string,
  ) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: {
        freelance_id,
        type_freelance: TypeFreelance.Translation,
      },
    });

    if (!freelance) {
      throw new NotFoundException(
        'Freelance not found or is not a Translation.',
      );
    }

    // Convert to array if it's not already an array
    const files = Array.isArray(freelance.attachments)
      ? freelance.attachments
      : JSON.parse(freelance.attachments as unknown as string);

    const file = files.find((file) => file.filename === attachment_name);

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    const updatedFiles = files.filter(
      (file) => file.filename !== attachment_name,
    );

    // Hapus file dari direktori
    const filePath = path.join(
      __dirname,
      '../../..',
      'storage/attachment',
      file.filename,
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prismaService.freelance.update({
      where: { freelance_id: freelance_id },
      data: {
        attachments: updatedFiles,
      },
    });
  }

  async getRatingsTranslation(
    freelance_id: string,
    getSubmitRatingTranslationDto: GetAllDto,
  ) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: {
        freelance_id,
        type_freelance: TypeFreelance.Translation,
      },
    });

    if (!freelance) {
      throw new NotFoundException('Freelance not found');
    }

    const { limit, page, search, sort_order } = getSubmitRatingTranslationDto;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return new Intl.DateTimeFormat('id-ID', options).format(date);
    };

    let query: Prisma.SubmitRatingFindManyArgs = {
      where: {
        freelance_id,
        type_resource: TypeResource.Freelance,
      },
      orderBy: {
        updated_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
      include: {
        user: true,
      },
    };

    const ratings: any[] =
      await this.prismaService.submitRating.findMany(query);

    // Modify ratings to include formatted dates
    const modifiedRatings: any[] = ratings.map((ratings) => {
      const {
        submit_rating_id,
        rating,
        project_name,
        review,
        created_at,
        updated_at,
        user,
      } = ratings;

      return {
        submit_rating_id,
        rating,
        project_name,
        review,
        created_at: formatDate(created_at),
        updated_at: formatDate(updated_at),
        submited_by: user.full_name,
      };
    });

    // Perform search on formatted data
    const filteredRatings = search
      ? modifiedRatings.filter(
          (ratings) =>
            ratings.project_name.toLowerCase().includes(search.toLowerCase()) ||
            ratings.created_at.toLowerCase().includes(search.toLowerCase()) ||
            ratings.review.toLowerCase().includes(search.toLowerCase()) ||
            ratings.submited_by.toLowerCase().includes(search.toLowerCase()),
        )
      : modifiedRatings;

    // Pagination
    const totalData = filteredRatings.length;
    const pageIndex = page ? parseInt(page.toString()) : 1;
    const pageSize = limit ? parseInt(limit) : 10;
    const paginatedRatings = filteredRatings.slice(
      (pageIndex - 1) * pageSize,
      pageIndex * pageSize,
    );

    const totalPages = Math.ceil(totalData / pageSize);

    return {
      submitRating: paginatedRatings,
      limit: pageSize,
      page: pageIndex,
      totalData,
      totalPages,
    };
  }

  async getOneRatingTranslation(
    submit_rating_id: string,
    freelance_id: string,
  ) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: {
        freelance_id,
        type_freelance: TypeFreelance.Translation,
      },
    });

    if (!freelance) {
      throw new NotFoundException('Freelance not found');
    }

    const rating = await this.prismaService.submitRating.findUnique({
      where: {
        submit_rating_id: parseInt(submit_rating_id),
        freelance_id,
        type_resource: TypeResource.Freelance,
      },
      include: {
        user: true,
      },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found.');
    }

    return {
      submit_rating_id: rating.submit_rating_id,
      rating: rating.rating,
      project_name: rating.project_name,
      review: rating.review,
      files: rating.files,
      submited_by: rating.user.full_name,
      created_at: rating.created_at,
      updated_at: rating.updated_at,
    };
  }

  async createRatingTranslation(
    freelance_id: string,
    data: Prisma.SubmitRatingCreateInput,
    file: object[],
    userId: number,
  ) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: {
        freelance_id,
        type_freelance: TypeFreelance.Translation,
      },
    });

    if (!freelance) {
      throw new NotFoundException(
        'Freelance not found or is not a Translation.',
      );
    }

    if (data.rating <= 0 || data.rating > 5 || data.rating % 0.5 !== 0) {
      throw new BadRequestException(
        'Rating must be between 1 and 5. It must be a multiple of 0.5',
      );
    }

    return this.prismaService.submitRating.create({
      data: {
        rating: parseFloat(data.rating.toString()),
        project_name: data.project_name,
        review: data.review,
        type_resource: TypeResource.Freelance,
        user_id: userId,
        freelance_id: freelance_id,
        files: file,
      },
    });
  }

  async downloadFileRatingTranslation(
    freelance_id: string,
    submit_rating_id: string,
    filename: string,
    res: Response,
  ) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: {
        freelance_id,
        type_freelance: TypeFreelance.Translation,
      },
    });

    if (!freelance) {
      throw new NotFoundException(
        'Freelance not found or is not a Translation.',
      );
    }

    const rating = await this.prismaService.submitRating.findUnique({
      where: {
        submit_rating_id: parseInt(submit_rating_id),
        freelance_id,
        type_resource: TypeResource.Freelance,
      },
    });

    if (!rating) {
      throw new NotFoundException('Submit Rating not found.');
    }

    const files: { filename: string; originalname: string }[] =
      rating.files as {
        filename: string;
        originalname: string;
      }[];
    const file = files.find((file) => file.filename === filename);

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    const filePath = path.join(
      __dirname,
      '../../..',
      'storage/file_submit_rating',
      file.filename,
    );

    return res.download(filePath, file.originalname);
  }

  async getPMNotesTranslation(
    freelance_id: string,
    getPMNotesTranslationDto: GetAllDto,
  ) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: { freelance_id, type_freelance: TypeFreelance.Translation },
    });

    if (!freelance) {
      throw new NotFoundException('Freelance not found');
    }

    const { limit, page, search, sort_order } = getPMNotesTranslationDto;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return new Intl.DateTimeFormat('id-ID', options).format(date);
    };

    let query: Prisma.PMNotesFindManyArgs = {
      where: {
        freelance_id,
        type_resource: TypeResource.Freelance,
      },
      orderBy: {
        updated_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
      include: {
        user_note: true,
        user_reply: true,
      },
    };

    const pmNotes: any[] = await this.prismaService.pMNotes.findMany(query);

    const modifiedPMNotes: any[] = pmNotes.map((pmNote) => {
      const {
        pm_notes_id,
        note,
        reply,
        status_approval,
        created_at,
        updated_at,
        user_note,
        user_reply,
      } = pmNote;

      return {
        pm_notes_id,
        note,
        reply,
        status_approval,
        created_at: formatDate(created_at),
        updated_at: formatDate(updated_at),
        user_note: user_note.full_name,
        user_reply: user_reply ? user_reply.full_name : null,
      };
    });

    const filteredNotes = search
      ? modifiedPMNotes.filter(
          (pmNote) =>
            pmNote.note.toLowerCase().includes(search.toLowerCase()) ||
            (pmNote.reply &&
              pmNote.reply.toLowerCase().includes(search.toLowerCase())) ||
            pmNote.user_note.toLowerCase().includes(search.toLowerCase()) ||
            pmNote.created_at.toLowerCase().includes(search.toLowerCase()),
        )
      : modifiedPMNotes;

    const totalData = filteredNotes.length;
    const pageIndex = page ? parseInt(page.toString(), 10) : 1;
    const pageSize = limit ? parseInt(limit.toString(), 10) : 10;
    const paginatedPMNotes = filteredNotes.slice(
      (pageIndex - 1) * pageSize,
      pageIndex * pageSize,
    );

    const totalPages = Math.ceil(totalData / pageSize);

    return {
      pmNotes: paginatedPMNotes,
      limit: pageSize,
      page: pageIndex,
      totalData,
      totalPages,
    };
  }

  async getOnePMNoteTranslation(pm_notes_id: string, freelance_id: string) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: { freelance_id, type_freelance: TypeFreelance.Translation },
    });

    if (!freelance) {
      throw new NotFoundException('Freelance not found');
    }

    const pmNote = await this.prismaService.pMNotes.findUnique({
      where: {
        pm_notes_id: parseInt(pm_notes_id),
        freelance_id,
        type_resource: TypeResource.Freelance,
      },
      include: {
        user_note: true,
        user_reply: true,
      },
    });

    if (!pmNote) {
      throw new NotFoundException('PM Note not found.');
    }

    return {
      pm_notes_id: pmNote.pm_notes_id,
      note: pmNote.note,
      reply: pmNote.reply,
      status_approval: pmNote.status_approval,
      created_at: pmNote.created_at,
      updated_at: pmNote.updated_at,
      user_note: pmNote.user_note.full_name,
      user_reply: pmNote.user_reply ? pmNote.user_reply.full_name : null,
    };
  }

  async createPMNoteTranslation(
    userId: number,
    freelance_id: string,
    data: Prisma.PMNotesCreateInput,
  ) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: {
        freelance_id,
        type_freelance: TypeFreelance.Translation,
      },
    });

    if (!freelance) {
      throw new NotFoundException(
        'Freelance not found or is not a Translation.',
      );
    }

    if (!data.note) {
      throw new BadRequestException('Note is required.');
    }

    return this.prismaService.pMNotes.create({
      data: {
        type_resource: TypeResource.Freelance,
        note: data.note,
        status_approval: StatusApproval.Pending,
        user_note_id: userId,
        freelance_id,
      },
    });
  }

  async approvePMNoteTranslation(
    pm_notes_id: string,
    freelance_id: string,
    data: Prisma.PMNotesUpdateInput,
    userId: number,
  ) {
    const freelance = await this.prismaService.freelance.findUnique({
      where: {
        freelance_id,
        type_freelance: TypeFreelance.Translation,
      },
    });

    if (!freelance) {
      throw new NotFoundException(
        'Freelance not found or is not a Translation.',
      );
    }

    if (
      !data.status_approval ||
      (data.status_approval !== StatusApproval.Approved &&
        data.status_approval !== StatusApproval.Rejected)
    ) {
      throw new BadRequestException('Invalid status_approval value');
    }

    if (!data.reply) {
      throw new BadRequestException('Reply is required.');
    }

    const note = await this.prismaService.pMNotes.findUnique({
      where: {
        pm_notes_id: parseInt(pm_notes_id),
        freelance_id,
        type_resource: TypeResource.Freelance,
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found.');
    }

    if (note.status_approval !== StatusApproval.Pending) {
      throw new BadRequestException(`Note has been ${note.status_approval}.`);
    }

    return this.prismaService.pMNotes.update({
      where: {
        pm_notes_id: parseInt(pm_notes_id),
        freelance_id: freelance_id,
      },
      data: {
        status_approval: data.status_approval,
        user_reply_id: userId,
        reply: data.reply,
      },
    });
  }
}
