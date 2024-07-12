/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Query,
  InternalServerErrorException,
  Res,
  NotFoundException,
  BadRequestException,
  ParseIntPipe,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { FinancialDirectoriesService } from './financial_directories.service';
import { CreateFinancialDirectoryDto } from './dto/create-financial_directory.dto';
import { UpdateFinancialDirectoryDto } from './dto/update-financial_directory.dto';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetFinancialDirectoriesDto } from './dto/get-financial_directory.dto';
import { FinancialDirectory, Prisma } from '@prisma/client';
import { Response } from 'express';
import { extname } from 'path';
import * as fs from 'fs';
import { PublicGuard } from 'src/guard/public.guard';
import { AllowAnyRole } from 'src/decorators/allow-any-role.decorator';
import { Public } from 'src/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

function fileSizeFilter(
  req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (file.size > MAX_FILE_SIZE) {
    cb(
      new BadRequestException(
        `File ${file.originalname} exceeds the 2MB size limit`,
      ),
      false,
    );
  } else {
    cb(null, true);
  }
}

@ApiTags('financial-directories')
@ApiBearerAuth()
@Controller('master-data/financial-directories')
@UseGuards(PublicGuard)
export class FinancialDirectoriesController {
  constructor(
    private readonly financialDirectoriesService: FinancialDirectoriesService,
  ) {}

  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  async findAll(@Query() getFinancialDirectoryDto: GetFinancialDirectoriesDto) {
    return await this.financialDirectoriesService.findAll(
      getFinancialDirectoryDto,
    );
  }

  @Post()
  @SetMetadata('permissions', ['Master Data:Financial Directory:Create:Create'])
  @UseInterceptors(
    FilesInterceptor('financial_directory_files', 5, {
      storage: diskStorage({
        destination: './storage/file_financial_directory',
        filename: (req, file, cb) => {
          const randomName = Array(4)
            .fill(null)
            .map(() => Math.round(Math.random() * 10).toString(10))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 2 * 1024 * 1024, // 2 MB
      },
      fileFilter: (req, file, cb) => {
        if (file.size > 2 * 1024 * 1024) {
          cb(
            new BadRequestException('Ukuran file maksimal adalah 2 MB'),
            false,
          );
        } else {
          cb(null, true);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Submit rating data and optional file attachments',
    required: true,
    schema: {
      type: 'object',
      properties: {
        financial_directory_name: { type: 'string' },
        financial_directory_files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async fileUpload(
    @UploadedFiles() financial_directory_files: Express.Multer.File[],
    @Body() createFinancialDirectoryDto: CreateFinancialDirectoryDto,
  ) {
    if (financial_directory_files.length > 5) {
      // Hapus file yang sudah diunggah jika jumlahnya lebih dari 5
      this.deleteUploadedFiles(financial_directory_files);
      throw new BadRequestException('Jumlah file maksimal adalah 5');
    }

    let lastIdFile = 0;
    const files = financial_directory_files.map((file) => ({
      id_file: ++lastIdFile, // auto increment,
      filename: file.filename,
      originalname: file.originalname,
    }));

    const totalFiles = financial_directory_files.length;

    return this.financialDirectoriesService.create(
      createFinancialDirectoryDto,
      files,
      totalFiles,
    );
  }

  // Fungsi untuk menghapus file yang sudah diunggah
  private deleteUploadedFiles(files: Express.Multer.File[]) {
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

  @Get(':financial_directory_id')
  @AllowAnyRole()
  async findOne(
    @Param('financial_directory_id', ParseIntPipe)
    financial_directory_id: string,
  ) {
    const financialDirectory = await this.financialDirectoriesService.findOne(
      financial_directory_id,
    );
    if (!financialDirectory) {
      throw new NotFoundException('Financial Directory not found');
    }
    return financialDirectory;
  }

  @Patch(':financial_directory_id')
  @SetMetadata('permissions', ['Master Data:Financial Directory:Edit:Edit'])
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './storage/file_financial_directory',
        filename: (req, file, cb) => {
          const randomName = Array(4)
            .fill(null)
            .map(() => Math.round(Math.random() * 10).toString(10))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: fileSizeFilter, // Tambahkan middleware file size filter
    }),
  )
  async updateFinancialDirectory(
    @Param('financial_directory_id') financial_directory_id: string,
    @Body() updateData: UpdateFinancialDirectoryDto,
    @UploadedFiles() financial_directory_files: Express.Multer.File[],
  ) {
    // Check if financial_directory_name is unique
    const existingDirectory = await this.financialDirectoriesService.findByName(
      updateData.financial_directory_name,
    );
    if (
      existingDirectory &&
      existingDirectory.financial_directory_id !==
        parseInt(financial_directory_id)
    ) {
      // Hapus file yang baru diunggah jika nama direktori sudah ada
      financial_directory_files.forEach((file) => fs.unlinkSync(file.path));
      throw new BadRequestException('Financial directory name already exists');
    }

    // Validate the total number of files
    const existingFiles =
      await this.financialDirectoriesService.getFilesByDirectoryId(
        financial_directory_id,
      );
    if (existingFiles.length + financial_directory_files.length > 5) {
      // Hapus file yang baru diunggah jika total file melebihi batas
      financial_directory_files.forEach((file) => fs.unlinkSync(file.path));
      throw new BadRequestException(
        'The total number of files should not exceed 5',
      );
    }

    // Update financial directory
    try {
      await this.financialDirectoriesService.updateFinancialDirectory(
        financial_directory_id,
        updateData,
        financial_directory_files,
      );

      return { message: 'Financial directory updated successfully' };
    } catch (error) {
      // Hapus file yang baru diunggah jika terjadi kesalahan lain
      financial_directory_files.forEach((file) => fs.unlinkSync(file.path));
      throw error;
    }
  }

  // // update FD
  // @Patch(':financial_directory_id')
  // @UseInterceptors(
  //   AnyFilesInterceptor({
  //     storage: diskStorage({
  //       destination: './fidir',
  //       filename: (req, file, cb) => {
  //         const randomName = Array(4)
  //           .fill(null)
  //           .map(() => Math.round(Math.random() * 10).toString(10))
  //           .join('');
  //         cb(null, `${randomName}${extname(file.originalname)}`);
  //       },
  //     }),
  //   }),
  // )
  // async updateFinancialDirectory(
  //   @Param('financial_directory_id') financial_directory_id: string,
  //   @Body() updateData: UpdateFinancialDirectoryDto,
  //   @UploadedFiles() financial_directory_files: Express.Multer.File[],
  // ) {
  //   let lastIdFile = 0;
  //   const files = financial_directory_files.map((file) => ({
  //     id_file: ++lastIdFile, // auto increment,
  //     filename: file.filename,
  //     originalname: file.originalname,
  //   }));

  //   const totalFiles = financial_directory_files.length;

  //   await this.financialDirectoriesService.updateFinancialDirectory(
  //     financial_directory_id,
  //     updateData,
  //     files,
  //     totalFiles,
  //   );
  //   return { message: 'Financial directory updated successfully' };
  // }

  // @Patch(':financial_directory_id')
  //   @UseInterceptors(
  //     AnyFilesInterceptor({
  //       storage: diskStorage({
  //         destination: './src/fidir',
  //         filename: (req, file, cb) => {
  //           const randomName = Array(4)
  //             .fill(null)
  //             .map(() => Math.round(Math.random() * 10).toString(10))
  //             .join('');
  //           cb(null, `${randomName}${extname(file.originalname)}`);
  //         },
  //       }),
  //     }),
  //   )
  //   async update(
  //     @UploadedFiles() financial_directory_files: Express.Multer.File[],
  //     @Param('financial_directory_id') financial_directory_id: string,
  //     @Body() updateFinancialDirectoryDto: Prisma.FinancialDirectoryUpdateInput,
  //   ) {
  //     const file = financial_directory_files.map((file) => ({
  //       filename: file.filename,
  //       originalname: file.originalname,
  //     }));
  //     return this.financialDirectoriesService.update(
  //       financial_directory_id,
  //       updateFinancialDirectoryDto,
  //       file,
  //     );
  //   }

  // hapus financial directory
  @Delete(':id')
  @SetMetadata('permissions', ['Master Data:Financial Directory:Delete:Delete'])
  remove(@Param('id') id: string) {
    return this.financialDirectoriesService.remove(+id);
  }

  // download file
  @Get(':financial_directory_id/:id_file/download')
  @Public()
  async downloadFile(
    @Param('financial_directory_id') financial_directory_id: string,
    @Param('id_file') id_file: string,
    @Res() res: Response,
  ) {
    return this.financialDirectoriesService.downloadFile(
      financial_directory_id,
      id_file,
      res,
    );
  }

  // delete file
  @Delete(':financial_directory_id/:id_file')
  @SetMetadata('permissions', ['Master Data:Financial Directory:Delete:Delete'])
  async deleteFile(
    @Param('financial_directory_id') financial_directory_id: string,
    @Param('id_file') id_file: string,
  ) {
    await this.financialDirectoriesService.deleteFile(
      financial_directory_id,
      id_file,
    );
    return { message: 'File deleted successfully' };
  }

  // @Get(':financial_directory_id/:filename/download')
  // async downloadFile(
  //   @Param('filename') filename: string,
  //   @Param('financial_directory_id') financial_directory_id: string,
  //   @Res() res: Response,
  // ) {
  //   return this.financialDirectoriesService.downloadFile(
  //     filename,
  //     financial_directory_id,
  //     res,
  //   );
  // }
}
