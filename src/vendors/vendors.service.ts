/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { PrismaService } from 'src/prisma.service';
import { GetVendorDto } from './dto/get-vendor.dto';
import { Prisma, StatusApproval, TypeResource } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import * as fastcsv from 'fast-csv';
import * as xlsx from 'xlsx';
import { RecordLogService } from 'src/record_log/record_log.service';
import { REQUEST } from '@nestjs/core';
import { IsEmail, validate } from 'class-validator';

@Injectable()
class VendorEmailValidation {
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  constructor(email: string) {
    this.email = email;
  }
}

export class VendorsService {
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

  // Fungsi untuk mendapatkan ID Vendor selanjutnya
  async getNextVendorId() {
    const lastVendor = await this.prismaService.vendor.findFirst({
      orderBy: { username: 'desc' },
    });

    if (!lastVendor) {
      return 1;
    }

    const lastVendorId = parseInt(lastVendor.username.slice(2), 10);
    return lastVendorId + 1;
  }

  private pad(number: number, size: number) {
    let result = number.toString();
    while (result.length < size) {
      result = '0' + result;
    }
    return result;
  }

  async createVendor(createVendorDto: CreateVendorDto) {
    const mandatoryFields = [
      'vendor_name',
      'whatsapp',
      'pic_name',
      'email',
      'contact_via',
      'country_id',
      'state_id',
      'city_id',
      'district',
      'postal_code',
    ];

    const missingFields = mandatoryFields.filter(
      (field) => !createVendorDto[field],
    );

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `The following fields are missing or invalid: ${missingFields.join(', ')}`,
      );
    }

    const existingEmail = await this.prismaService.vendor.findFirst({
      where: { email: createVendorDto.email, deleted: false },
    });

    if (existingEmail) {
      throw new ConflictException('Email dengan nama yang sama sudah ada');
    }

    const country_id = Number(createVendorDto.country_id);
    const state_id = Number(createVendorDto.state_id);
    const city_id = Number(createVendorDto.city_id);
    const currency_id = createVendorDto.currency_id
      ? Number(createVendorDto.currency_id)
      : null;
    let list_rate = createVendorDto.list_rate;

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

    let nextId = await this.getNextVendorId();
    let vendorId = `V${this.pad(nextId, 3)}`;

    let isUnique = false;
    while (!isUnique) {
      const existingVendor = await this.prismaService.vendor.findFirst({
        where: { username: vendorId },
      });
      if (!existingVendor) {
        isUnique = true;
      } else {
        nextId++; // Menambah nextId agar vendorId berikutnya berbeda
        vendorId = `V${this.pad(nextId, 3)}`;
      }
    }

    // Convert empty strings to null
    const convertEmptyStringToNull = (value: any) =>
      value === '' ? null : value;

    try {
      const createdVendor = await this.prismaService.vendor.create({
        data: {
          username: vendorId, // Menggunakan vendorId untuk username
          vendor_name: createVendorDto.vendor_name,
          whatsapp: createVendorDto.whatsapp,
          pic_name: createVendorDto.pic_name,
          email: createVendorDto.email,
          contact_via: createVendorDto.contact_via,
          country_id: country_id,
          state_id: state_id,
          city_id: city_id,
          district: createVendorDto.district,
          postal_code: createVendorDto.postal_code,
          full_address: convertEmptyStringToNull(createVendorDto.full_address),
          bank_name: convertEmptyStringToNull(createVendorDto.bank_name),
          branch_office: convertEmptyStringToNull(
            createVendorDto.branch_office,
          ),
          account_holder_name: convertEmptyStringToNull(
            createVendorDto.account_holder_name,
          ),
          account_number: convertEmptyStringToNull(
            createVendorDto.account_number,
          ),
          name_tax: convertEmptyStringToNull(createVendorDto.name_tax),
          resource_status: convertEmptyStringToNull(
            createVendorDto.resource_status,
          ),
          npwp_number: convertEmptyStringToNull(createVendorDto.npwp_number),
          currency_id: currency_id,
          attachments: [],
          list_rate: list_rate as unknown as Prisma.JsonArray,
        },
      });
      // record log
      const userEmail = this.request.user.email;
      await this.logFieldCreate(createdVendor, null, userEmail, 'Create');
      return createdVendor;
    } catch (error) {
      console.error('Error occurred during vendor creation:', error.message);
      throw new InternalServerErrorException('Failed to create vendor');
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
      'vendor_id',
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
          menu_name: 'Resource Manager - Vendor',
          data_name: newData.vendor_id.toString(),
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

  async importVendor(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Membaca file yang diunggah dari buffer
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json<any>(worksheet);

    const mandatoryFields = [
      'Vendor Name',
      'Whatsapp',
      'PIC Name',
      'Email',
      'Contact Via',
      'Country',
      'Province',
      'City',
      'District',
      'Postal Code',
    ];

    let nextId = await this.getNextVendorId();
    const vendorsMap = new Map<string, any>();

    let successCount = 0;
    let failureCount = 0;
    let previousEmail = null;

    for (const entry of jsonData) {
      const missingFields = mandatoryFields.filter((field) => !entry[field]);

      const {
        'Vendor Name': vendor_name,
        Whatsapp,
        'PIC Name': pic_name,
        Email,
        'Contact Via': contact_via,
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

            const vendor = vendorsMap.get(previousEmail);
            vendor.list_rate.push({
              type_of_service,
              rate: Number(Rate),
              rate_type_id: rateTypeRecord.rate_type_id,
              calc_unit,
            });
          }
        } else {
          if (Email) {
            previousEmail = Email; // Simpan email sebagai referensi untuk baris berikutnya

            const emailValidation = new VendorEmailValidation(Email);
            const errors = await validate(emailValidation);
            if (errors.length > 0) {
              throw new BadRequestException('Invalid email address: ' + Email);
            }

            if (!vendorsMap.has(Email)) {
              vendorsMap.set(Email, {
                vendor_name,
                Whatsapp,
                pic_name,
                Email,
                contact_via,
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

              const vendor = vendorsMap.get(Email);
              vendor.list_rate.push({
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

    // Memproses dan menyimpan data ke database
    for (const [key, entry] of vendorsMap.entries()) {
      let isUnique = false;
      let vendorId;
      while (!isUnique) {
        vendorId = `V${this.pad(nextId, 3)}`;
        const existingVendor = await this.prismaService.vendor.findFirst({
          where: { username: vendorId },
        });
        if (!existingVendor) {
          isUnique = true;
        } else {
          nextId++; // Menambah nextId agar vendorId berikutnya berbeda
        }
      }

      try {
        const {
          vendor_name,
          Whatsapp,
          pic_name,
          Email,
          contact_via,
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

        const emailExists = await this.prismaService.vendor.findFirst({
          where: { email: Email, deleted: false },
        });

        if (emailExists) {
          throw new ConflictException(
            `Email ${Email} sudah terdaftar dalam database.`,
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

        // Memvalidasi list_rate jika ada
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

        await this.prismaService.vendor.create({
          data: {
            username: vendorId,
            vendor_name,
            whatsapp: Whatsapp.toString(),
            pic_name,
            email: Email,
            contact_via,
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
      message: `${successCount} data successfuly added, ${failureCount} data failed`,
    };
  }

  async exportVendor(format: string, res: Response) {
    const vendors = await this.prismaService.vendor.findMany({
      where: {
        deleted: false,
      },
      include: {
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

    vendors.forEach((vendor) => {
      const { list_rate, ...rest } = vendor;

      // Ensure list_rate is parsed correctly
      let parsedListRate = [];
      if (typeof list_rate === 'string') {
        parsedListRate = JSON.parse(list_rate);
      } else if (Array.isArray(list_rate)) {
        parsedListRate = list_rate;
      }

      if (parsedListRate.length > 0) {
        parsedListRate.forEach((rateDetail, index) => {
          exportData.push({
            Username: index === 0 ? rest.username : '',
            'Vendor Name': index === 0 ? rest.vendor_name : '',
            Whatsapp: index === 0 ? rest.whatsapp : '',
            'PIC Name': index === 0 ? rest.pic_name : '',
            Email: index === 0 ? rest.email : '',
            'Contact Via': index === 0 ? rest.contact_via : '',
            Country: index === 0 ? vendor.country?.name || '' : '',
            Province: index === 0 ? vendor.state?.name || '' : '',
            City: index === 0 ? vendor.city?.name || '' : '',
            District: index === 0 ? rest.district : '',
            'Postal Code': index === 0 ? rest.postal_code : '',
            'Full Address': index === 0 ? rest.full_address : '',
            Currency: index === 0 ? vendor.currency?.name || '' : '',
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
          Username: vendor.username,
          'Vendor Name': vendor.vendor_name,
          Whatsapp: vendor.whatsapp,
          'PIC Name': vendor.pic_name,
          Email: vendor.email,
          'Contact Via': vendor.contact_via,
          Country: vendor.country?.name || '',
          Province: vendor.state?.name || '',
          City: vendor.city?.name || '',
          District: vendor.district,
          'Postal Code': vendor.postal_code,
          'Full Address': vendor.full_address,
          Currency: vendor.currency?.name || '',
          'Type of Service': '',
          Rate: '',
          'Rate Type': '',
          'Calculation Unit': '',
          Bank: vendor.bank_name,
          'Account Holder Name': vendor.account_holder_name,
          'Account Number': vendor.account_number,
          'Branch Office of Bank': vendor.branch_office,
          'Resource Status': vendor.resource_status,
          'NPWP Number': vendor.npwp_number,
          'Tax Type': vendor.name_tax,
        });
      }
    });

    let fileName = `vendor-${new Date().toISOString()}`;
    let data;

    if (format === 'csv') {
      fileName += '.csv';
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Type', 'text/csv');

      const csvStream = fastcsv.format({ headers: true });

      csvStream.pipe(res);
      exportData.forEach((vendor) => {
        csvStream.write(vendor);
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

  async findAllVendor(getVendorDto: GetVendorDto) {
    const { limit, page, search, sort_order } = getVendorDto;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return new Intl.DateTimeFormat('id-ID', options).format(date);
    };

    let query: Prisma.VendorFindManyArgs = {
      where: {
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

    const vendors: any[] = await this.prismaService.vendor.findMany(query);

    const modifiedVendors: any[] = await Promise.all(
      vendors.map(async (vendor) => {
        const {
          vendor_id,
          username,
          vendor_name,
          whatsapp,
          email,
          created_at,
        } = vendor;

        // Menghitung rata-rata rating untuk setiap vendor_id
        const averageRating = await this.prismaService.submitRating.groupBy({
          by: ['vendor_id'],
          _avg: { rating: true },
          where: { vendor_id: vendor_id },
        });

        const avgRating =
          averageRating.length > 0
            ? parseFloat((averageRating[0]._avg.rating || 0).toFixed(1))
            : 0;

        return {
          vendor_id,
          username,
          vendor_name,
          email,
          whatsapp,
          average_rating: avgRating,
          created_at: formatDate(created_at),
        };
      }),
    );

    const filteredNote = search
      ? modifiedVendors.filter(
          (ratings) =>
            ratings.username.toLowerCase().includes(search.toLowerCase()) ||
            ratings.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
            ratings.whatsapp.toLowerCase().includes(search.toLowerCase()) ||
            ratings.email.toLowerCase().includes(search.toLowerCase()) ||
            ratings.created_at.toLowerCase().includes(search.toLowerCase()),
        )
      : modifiedVendors;

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

  async findOneVendor(vendorWhereUniqueInput: Prisma.VendorWhereUniqueInput) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: vendorWhereUniqueInput,
      include: {
        country: true,
        state: true,
        city: true,
        currency: true,
      },
    });

    if (!vendor) {
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
      vendor.list_rate as unknown as {
        rate: number;
        rate_type_id: number;
        calc_unit: string;
      }[]
    ).map((rate) => ({
      ...rate,
      rate_type_name: rateTypeMap[rate.rate_type_id],
    }));

    const {
      vendor_id,
      username,
      vendor_name,
      whatsapp,
      pic_name,
      email,
      contact_via,
      country,
      state,
      city,
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
      currency,
      attachments,
    } = vendor;

    return {
      vendor: {
        vendor_id,
        username,
        vendor_name,
        whatsapp,
        pic_name,
        email,
        contact_via,
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

  async updateVendor(vendor_id: string, data: UpdateVendorDto) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: { vendor_id },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Validasi state_id
    if ('state_id' in data) {
      const countryId = data.country_id ?? vendor.country_id;
      const stateExists = await this.prismaService.state.findFirst({
        where: {
          id: data.state_id,
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
    if ('city_id' in data) {
      const countryId = data.country_id ?? vendor.country_id;
      const cityExists = await this.prismaService.city.findFirst({
        where: {
          id: data.city_id,
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

    // Validate list_rate
    let updatedListRate = undefined;
    if ('list_rate' in data) {
      const list_rate = data.list_rate;
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
      const updatedListRate = list_rate.map((rate) => ({
        ...rate,
      }));
    }

    // Convert empty strings to null
    const sanitizedData = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitizedData[key] = data[key] === '' ? null : data[key];
      }
    }

    const updateData = {
      ...sanitizedData,
      ...(updatedListRate && {
        list_rate: updatedListRate as unknown as Prisma.JsonArray,
      }),
    };

    const updatedVendor = await this.prismaService.vendor.update({
      where: { vendor_id },
      data: updateData,
    });
    // record log
    const userEmail = this.request.user.email;
    await this.logFieldUpdate(updatedVendor, vendor, userEmail, 'Update');
    return updatedVendor;
  }

  // RECORD LOG UPDATE
  private async logFieldUpdate(
    newData: any,
    oldData: any,
    updatedByEmail: string,
    action: string,
  ) {
    const fieldsToExclude = [
      'vendor_id',
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
          menu_name: 'Resource Manager - Vendor',
          data_name: newData.vendor_id.toString(),
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

  async removeVendor(vendorWhereUniqueInput: Prisma.VendorWhereUniqueInput) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: vendorWhereUniqueInput,
    });
    if (!vendor) {
      throw new NotFoundException('vendor not found');
    }

    try {
      await this.prismaService.vendor.update({
        where: vendorWhereUniqueInput,
        data: {
          deleted: true,
        },
      });
      // RECORD LOG
      const userEmail = this.request.user.email;
      const dataName = vendorWhereUniqueInput.vendor_id
        ? vendorWhereUniqueInput.vendor_id.toString()
        : Object.values(vendorWhereUniqueInput).toString();
      await this.logService.create({
        menu_name: 'Resource Manager - Vendor',
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

  async getAttachmentsVendor(vendor_id: string, page: number, limit: number) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: {
        vendor_id,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const allAttachments = Array.isArray(vendor.attachments)
      ? vendor.attachments
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

  async uploadAttachmentVendor(vendor_id: string, newFile: object[]) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: {
        vendor_id,
      },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Tentukan file lama yang sudah ada dalam data rating
    const existingFiles: string[] = (vendor.attachments as string[]) || [];

    // Gabungkan file lama dengan file baru
    const updatedFiles = [...existingFiles, ...newFile];

    // Lakukan pembaruan pada submitRating
    const updateData: Prisma.VendorUpdateInput = {
      attachments: updatedFiles,
    };

    return this.prismaService.vendor.update({
      where: {
        vendor_id,
      },
      data: updateData,
    });
  }

  async downloadAttachmentVendor(
    vendor_id: string,
    attachment_name: string,
    res: Response,
  ) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: {
        vendor_id,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Convert to array if it's not already an array
    const files = Array.isArray(vendor.attachments)
      ? vendor.attachments
      : JSON.parse(vendor.attachments as unknown as string);

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

  async removeAttachmentVendor(vendor_id: string, attachment_name: string) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: {
        vendor_id,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Convert to array if it's not already an array
    const files = Array.isArray(vendor.attachments)
      ? vendor.attachments
      : JSON.parse(vendor.attachments as unknown as string);

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

    await this.prismaService.vendor.update({
      where: { vendor_id },
      data: {
        attachments: updatedFiles,
      },
    });
  }

  async getRatingsVendor(vendor_id: string, query: GetVendorDto) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: { vendor_id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const { limit, page, search, sort_order } = query;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return new Intl.DateTimeFormat('id-ID', options).format(date);
    };

    let ratingsQuery: Prisma.SubmitRatingFindManyArgs = {
      where: {
        vendor_id,
      },
      orderBy: {
        updated_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
      include: {
        user: true,
      },
    };

    const ratings: any[] =
      await this.prismaService.submitRating.findMany(ratingsQuery);

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

    const filteredRatings = search
      ? modifiedRatings.filter(
          (ratings) =>
            ratings.project_name.toLowerCase().includes(search.toLowerCase()) ||
            ratings.created_at.toLowerCase().includes(search.toLowerCase()) ||
            ratings.review.toLowerCase().includes(search.toLowerCase()) ||
            ratings.submited_by.toLowerCase().includes(search.toLowerCase()),
        )
      : modifiedRatings;

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

  async getRatingVendor(vendor_id: string, rating_id: string) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: { vendor_id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const rating = await this.prismaService.submitRating.findUnique({
      where: {
        submit_rating_id: parseInt(rating_id),
        vendor_id,
      },
      include: {
        user: true,
      },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
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

  async createRatingVendor(
    vendor_id: string,
    data: Prisma.SubmitRatingCreateInput,
    file: object[],
    userId: number,
  ) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: { vendor_id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
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
        type_resource: TypeResource.Vendor,
        user_id: userId,
        vendor_id,
        files: file,
      },
    });
  }

  async downloadFileRatingVendor(
    vendor_id: string,
    submit_rating_id: string,
    filename: string,
    res: Response,
  ) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: {
        vendor_id,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendot not found.');
    }

    const rating = await this.prismaService.submitRating.findUnique({
      where: {
        submit_rating_id: parseInt(submit_rating_id),
        vendor_id,
        type_resource: TypeResource.Vendor,
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

  async getPmNotesVendor(vendor_id: string, query: GetVendorDto) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: { vendor_id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const { limit, page, search, sort_order } = query;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return new Intl.DateTimeFormat('id-ID', options).format(date);
    };

    let pmNotesQuery: Prisma.PMNotesFindManyArgs = {
      where: {
        vendor_id,
        type_resource: TypeResource.Vendor,
      },
      orderBy: {
        updated_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
      include: {
        user_note: true,
        user_reply: true,
      },
    };

    const pmNotes: any[] =
      await this.prismaService.pMNotes.findMany(pmNotesQuery);

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
    const pageIndex = page ? parseInt(page.toString()) : 1;
    const pageSize = limit ? parseInt(limit) : 10;
    const paginatedRatings = filteredNotes.slice(
      (pageIndex - 1) * pageSize,
      pageIndex * pageSize,
    );

    const totalPages = Math.ceil(totalData / pageSize);

    return {
      pmNotes: paginatedRatings,
      limit: pageSize,
      page: pageIndex,
      totalData,
      totalPages,
    };
  }

  async getPmNoteVendor(vendor_id: string, pm_notes_id: string) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: { vendor_id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const pmNote = await this.prismaService.pMNotes.findUnique({
      where: {
        pm_notes_id: parseInt(pm_notes_id),
        vendor_id,
        type_resource: TypeResource.Vendor,
      },
      include: {
        user_note: true,
        user_reply: true,
      },
    });

    if (!pmNote) {
      throw new NotFoundException('PM Note not found');
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

  async createPmNoteVendor(
    userId: number,
    vendor_id: string,
    data: Prisma.PMNotesCreateInput,
  ) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: { vendor_id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (!data.note) {
      throw new BadRequestException('Note is required.');
    }

    return this.prismaService.pMNotes.create({
      data: {
        type_resource: TypeResource.Vendor,
        note: data.note,
        status_approval: StatusApproval.Pending,
        user_note_id: userId,
        vendor_id,
      },
    });
  }

  async updatePmNoteVendor(
    pm_notes_id: string,
    vendor_id: string,
    data: Prisma.PMNotesUpdateInput,
    userId: number,
  ) {
    const vendor = await this.prismaService.vendor.findUnique({
      where: { vendor_id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
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

    const pmNote = await this.prismaService.pMNotes.findUnique({
      where: {
        pm_notes_id: parseInt(pm_notes_id),
        vendor_id,
        type_resource: TypeResource.Vendor,
      },
    });

    if (!pmNote) {
      throw new NotFoundException('PM Note not found');
    }

    if (pmNote.status_approval !== StatusApproval.Pending) {
      throw new BadRequestException(`Note has been ${pmNote.status_approval}.`);
    }

    return this.prismaService.pMNotes.update({
      where: {
        pm_notes_id: parseInt(pm_notes_id),
        vendor_id,
      },
      data: {
        status_approval: data.status_approval,
        user_reply_id: userId,
        reply: data.reply,
      },
    });
  }
}
