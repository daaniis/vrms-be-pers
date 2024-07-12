/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateFinancialDirectoryDto } from './dto/create-financial_directory.dto';
import { UpdateFinancialDirectoryDto } from './dto/update-financial_directory.dto';
import { validate } from 'class-validator';
import { Express } from 'express';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { GetFinancialDirectoriesDto } from './dto/get-financial_directory.dto';
import { createWriteStream } from 'fs';
import * as path from 'path';
import { Response } from 'express';
import { RecordLogService } from 'src/record_log/record_log.service';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class FinancialDirectoriesService {
  constructor(
    private prisma: PrismaService,
    private logService: RecordLogService,
    @Inject(REQUEST) private readonly request: any,
  ) {
    const uploadDir = './storage/file_financial_directory';
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir);
    }
  }

  // untuk record log, jangan dihapus
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

  async create(
    createFinancialDirectoryDto: CreateFinancialDirectoryDto,
    files: any[],
    totalFiles: number,
  ): Promise<any> {

    // validasi financial_directory_name tidak kosong
    if (!createFinancialDirectoryDto.financial_directory_name) {
      // Hapus file yang sudah diunggah jika validasi gagal
      this.deleteUploadedFiles(files);
      throw new BadRequestException('financial directory name is required');
    }

    // Validasi panjang financial directory name
    if (createFinancialDirectoryDto.financial_directory_name.length > 255) {
      // Hapus file yang sudah diunggah jika validasi gagal
      this.deleteUploadedFiles(files);
      throw new BadRequestException('financial directory name must be shorter than or equal to 255 characters');
    }
    // Cek apakah nama financial directory sudah ada
    const existingDirectory = await this.prisma.financialDirectory.findFirst({
      where: {
        financial_directory_name:
          createFinancialDirectoryDto.financial_directory_name,
      },
    });

    if (existingDirectory) {
      // Hapus file yang sudah diunggah jika nama sudah ada
      this.deleteUploadedFiles(files);
      throw new BadRequestException('Financial directory name already exists');
    }

    try {
      // Jika nama belum ada, buat financial directory baru
      const addFinancialDirectory = await this.prisma.financialDirectory.create({
        data: {
          financial_directory_name:
            createFinancialDirectoryDto.financial_directory_name,
          financial_directory_files: files,
          financial_directory_total: totalFiles,
        },
      });
      // record log
      const userEmail = this.request.user.email;
      await this.logFieldCreate(addFinancialDirectory, null, userEmail, 'Create');
      return addFinancialDirectory;
    } catch (error) {
      // Hapus file yang sudah diunggah jika terjadi error saat menyimpan ke database
      this.deleteUploadedFiles(files);
      throw new InternalServerErrorException(
        'Error creating financial directory',
      );
    }
  }

  // RECORD LOG CREATE
  private async logFieldCreate(newData: any, oldData: any, updatedByEmail: string, action: string) {
    const fieldsToExclude = ['financial_directory_id', 'financial_directory_files', 'financial_directory_total', 'deleted', 'created_at', 'updated_at'];
    const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));      
    for (const field of fields) {
      const formattedField = this.formatField(field);
      if (newData[field] !== oldData?.[field]) {
        await this.logService.create({
          menu_name: 'Master Data - Financial Directory',
          data_name: newData.financial_directory_id.toString(),
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

  // Fungsi untuk menghapus file yang sudah diunggah
  private deleteUploadedFiles(files: any[]) {
    const fs = require('fs');
    const path = require('path');
    files.forEach((file) => {
      const filePath = path.join(
        './storage/file_financial_directory',
        file.filename,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }

  async updateFinancialDirectory(
    financial_directory_id: string,
    updateData: UpdateFinancialDirectoryDto,
    newFiles: Express.Multer.File[],
  ): Promise<any> {

    // validasi financial_directory_name tidak kosong
    if (!updateData.financial_directory_name) {
      // Hapus file yang sudah diunggah jika validasi gagal
      this.deleteUploadedFiles(newFiles);
      throw new BadRequestException('financial directory name is required');
    }

    // Validasi panjang financial directory name
    if (updateData.financial_directory_name.length > 255) {
      // Hapus file yang sudah diunggah jika validasi gagal
      this.deleteUploadedFiles(newFiles);
      throw new BadRequestException('financial directory name must be shorter than or equal to 255 characters');
    }

    // Ambil Financial Directory yang akan diperbarui
    const existingFinancialDirectory =
      await this.prisma.financialDirectory.findUnique({
        where: {
          financial_directory_id: parseInt(financial_directory_id),
        },
      });

    if (!existingFinancialDirectory) {
      throw new NotFoundException('Financial Directory not found');
    }

    // Validasi ukuran file tidak lebih dari 2MB
    newFiles.forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB dalam byte
        // Hapus file yang baru diunggah jika ukurannya melebihi batas
        fs.unlinkSync(file.path);
        throw new BadRequestException(
          `File ${file.originalname} exceeds the 2MB size limit`,
        );
      }
    });

    // Tentukan file lama yang sudah ada dalam data Financial Directory
    const existingFiles: {
      id_file: number;
      filename: string;
      originalname: string;
    }[] = existingFinancialDirectory.financial_directory_files as {
      id_file: number;
      filename: string;
      originalname: string;
    }[];

    // Menentukan id_file terakhir yang ada
    let lastIdFile = existingFiles.reduce(
      (maxId, file) => Math.max(maxId, file.id_file),
      0,
    );

    // Menambahkan file baru dengan id_file yang unik
    const filesWithNewIds = newFiles.map((file) => ({
      id_file: ++lastIdFile,
      filename: file.filename,
      originalname: file.originalname,
    }));

    // Validasi jumlah total file tidak lebih dari 5
    const updatedFiles = [...existingFiles, ...filesWithNewIds];
    if (updatedFiles.length > 5) {
      // Hapus file yang baru diunggah jika total file melebihi batas
      newFiles.forEach((file) => fs.unlinkSync(file.path));
      throw new BadRequestException(
        'The total number of files cannot exceed 5',
      );
    }

    // Cek apakah ada financial directory lain dengan nama yang sama
    const existingDirectory = await this.prisma.financialDirectory.findFirst({
      where: {
        financial_directory_name: updateData.financial_directory_name,
        financial_directory_id: {
          not: parseInt(financial_directory_id),
        },
      },
    });

    if (existingDirectory) {
      // Hapus file yang baru diunggah jika nama direktori sudah ada
      newFiles.forEach((file) => fs.unlinkSync(file.path));
      throw new BadRequestException('Financial directory name already exists');
    }

    // Update data
    const updatePayload: Prisma.FinancialDirectoryUpdateInput = {
      financial_directory_files: updatedFiles,
      financial_directory_total: updatedFiles.length,
    };

    // Update nama financial directory jika ada
    if (updateData.financial_directory_name) {
      updatePayload.financial_directory_name =
        updateData.financial_directory_name;
    }

    // Update financial directory
    try {
      const updateFinancialDirectory = await this.prisma.financialDirectory.update({
        where: { financial_directory_id: parseInt(financial_directory_id) },
        data: updatePayload,
      });
      // record log
      const userEmail = this.request.user.email;
        await this.logFieldUpdate(updateFinancialDirectory, existingFinancialDirectory, userEmail, 'Update');                
      return updateFinancialDirectory;
    } catch (error) {
      // Hapus file yang baru diunggah jika terjadi kesalahan lain
      newFiles.forEach((file) => fs.unlinkSync(file.path));
      throw error;
    }
  }

  // RECORD LOG UPDATE
  private async logFieldUpdate(newData: any, oldData: any, updatedByEmail: string, action: string) {
    const fieldsToExclude = ['financial_directory_id', 'financial_directory_files', 'financial_directory_total', 'deleted', 'created_at', 'updated_at'];
    const fields = Object.keys(newData).filter(field => !fieldsToExclude.includes(field));

    for (const field of fields) {
      const formattedField = this.formatField(field);
      if (newData[field] !== oldData?.[field]) {
        await this.logService.create({
          menu_name: 'Master Data - Financial Directory',
          data_name: newData.financial_directory_id.toString(),
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

  async findByName(financial_directory_name: string): Promise<any> {
    return this.prisma.financialDirectory.findFirst({
      where: { financial_directory_name },
    });
  }

  async getFilesByDirectoryId(
    financial_directory_id: string,
  ): Promise<{ id_file: number; filename: string; originalname: string }[]> {
    const financialDirectory = await this.prisma.financialDirectory.findUnique({
      where: { financial_directory_id: parseInt(financial_directory_id) },
    });

    if (!financialDirectory) {
      throw new NotFoundException('Financial Directory not found');
    }

    return financialDirectory.financial_directory_files as {
      id_file: number;
      filename: string;
      originalname: string;
    }[];
  }

  async getFinancialDirectoryById(
    financial_directory_id: string,
  ): Promise<any> {
    return this.prisma.financialDirectory.findUnique({
      where: {
        financial_directory_id: parseInt(financial_directory_id),
      },
    });
  }

  // get all Financial Directory
  async findAll(
    getFinancialDirectoryDto: GetFinancialDirectoriesDto,
  ): Promise<any> {
    const { limit, page, search, sort_order } = getFinancialDirectoryDto;

    let query: Prisma.FinancialDirectoryFindManyArgs = {
      take: limit ? parseInt(limit) : 10,
      skip: page && limit ? (page - 1) * parseInt(limit) : 0,
      where: {
        financial_directory_name: {
          contains: search,
          mode: 'insensitive',  // Menambahkan pencarian tidak case-sensitive
        },
      },
      orderBy: {
        updated_at: sort_order === 'oldest' ? 'asc' : 'desc',
      },
    };

    const financialDirectories =
      await this.prisma.financialDirectory.findMany(query);

    const totalData = await this.prisma.financialDirectory.count({
      where: {
        financial_directory_name: {
          contains: search,
          mode: 'insensitive',  // Menambahkan pencarian tidak case-sensitive
        },
      },
    });

    const totalPages = Math.ceil(totalData / (limit ? parseInt(limit) : 10));

    return {
      financialDirectories,
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page.toString()) : 1,
      totalData,
      totalPages,
    };
  }

  // detail
  async findOne(financial_directory_id: string) {
    const financialDirectory = await this.prisma.financialDirectory.findUnique({
      where: { financial_directory_id: parseInt(financial_directory_id) },
    });

    if (!financialDirectory) {
      throw new NotFoundException('Financial Directory not found');
    }

    return financialDirectory;
  }

  // Hapus Financial Directory
  async remove(financial_directory_id: number) {
    const financial_directory = await this.prisma.financialDirectory.findUnique(
      {
        where: {
          financial_directory_id,
        },
      },
    );

    if (!financial_directory) {
      throw new NotFoundException('Financial Directory tidak ditemukan');
    } else {
      // Hapus semua file yang terkait dengan financial directory ini dari server
      const files = Array.isArray(financial_directory.financial_directory_files)
        ? financial_directory.financial_directory_files
        : JSON.parse(
            financial_directory.financial_directory_files as unknown as string,
          );

      files.forEach((file) => {
        const filePath = path.join(
          __dirname,
          '../../../storage/file_financial_directory',
          file.filename,
        ); // Sesuaikan path sesuai struktur proyek
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      const deleteinancialDirectory = await this.prisma.financialDirectory.delete({
        where: { financial_directory_id },
      });
      // RECORD LOG
      const userEmail = this.request.user.email;
      await this.logService.create({
        menu_name: 'Master Data - Financial Directory',
        data_name: financial_directory_id.toString(),
        field: null,
        action: 'Delete',
        old_value: null,
        new_value: null,
        updated_by_email: userEmail,
        updated_at: new Date(),
      });
      if (!deleteinancialDirectory) {
        throw new NotFoundException('Data Tidak Ditemukan!');
      }
    }
  }

  // download file
  async downloadFile(
    financial_directory_id: string,
    id_file: string,
    res: Response,
  ): Promise<void> {
    const financial = await this.prisma.financialDirectory.findUnique({
      where: { financial_directory_id: parseInt(financial_directory_id) },
    });

    if (!financial) {
      throw new NotFoundException('Financial Directory not found');
    }

    // Convert to array if it's not already an array
    const files = Array.isArray(financial.financial_directory_files)
      ? financial.financial_directory_files
      : JSON.parse(financial.financial_directory_files as unknown as string);

    const file = files.find((file) => file.id_file === parseInt(id_file));

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    const filePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'storage',
      'file_financial_directory',
      file.filename,
    );
    return res.download(filePath);
  }

  // Delete file
  async deleteFile(
    financial_directory_id: string,
    id_file: string,
  ): Promise<void> {
    const financial = await this.prisma.financialDirectory.findUnique({
      where: { financial_directory_id: parseInt(financial_directory_id) },
    });

    if (!financial) {
      throw new NotFoundException('Financial Directory not found');
    }

    // Convert to array if it's not already an array
    const files = Array.isArray(financial.financial_directory_files)
      ? financial.financial_directory_files
      : JSON.parse(financial.financial_directory_files as unknown as string);

    const fileToDelete = files.find(
      (file) => file.id_file === parseInt(id_file),
    );
    if (!fileToDelete) {
      throw new NotFoundException('File not found');
    }

    const updatedFiles = files.filter(
      (file) => file.id_file !== parseInt(id_file),
    );

    // Hapus file dari server
    const filePath = path.join(
      __dirname,
      '../../../storage/file_financial_directory',
      fileToDelete.filename,
    ); // Sesuaikan path sesuai struktur proyek
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.financialDirectory.update({
      where: { financial_directory_id: parseInt(financial_directory_id) },
      data: {
        financial_directory_files: updatedFiles,
        financial_directory_total: updatedFiles.length,
      },
    });
  }
}
