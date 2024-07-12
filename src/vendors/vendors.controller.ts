/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
  NotFoundException,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UploadedFiles,
  UseGuards,
  SetMetadata,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { GetVendorDto } from './dto/get-vendor.dto';
import { Prisma } from '@prisma/client';
import {
  AnyFilesInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
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

@ApiTags('Vendor')
@ApiBearerAuth()
@Controller('vendors')
@UseGuards(PublicGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @ApiOperation({
    summary: 'Post vendor',
    description: 'Membuat vendor.',
  })
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   description: 'Vendor data',
  //   type: CreateVendorDto,
  // })
  @SetMetadata('permissions', ['Resource Manager:Vendor:Create:Create'])
  @UsePipes(new ValidationPipe({ transform: true }))
  async createVendor(@Body() createVendorDto: CreateVendorDto) {
    // Convert list_rate to array if it's a string and set default if undefined
    if (typeof createVendorDto.list_rate === 'string') {
      createVendorDto.list_rate = JSON.parse(createVendorDto.list_rate);
    } else if (!createVendorDto.list_rate) {
      createVendorDto.list_rate = []; // Berikan nilai default kosong jika list_rate tidak ada
    }

    return await this.vendorsService.createVendor(createVendorDto);
  }

  @Post('import')
  @ApiOperation({
    summary: 'Import vendor',
    description: 'Mengimport file excel vendor.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File Excel untuk diunggah',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @SetMetadata('permissions', ['Resource Manager:Vendor:Import:Import'])
  @SetMetadata('skipDefaultResponse', true)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async importVendor(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.vendorsService.importVendor(file);
  }

  @Public()
  @Get('export/:format')
  @ApiOperation({
    summary: 'Export vendor',
    description: 'Mengexport file excel vendor dengan format csv/xlsx.',
  })
  @AllowAnyRole()
  async exportVendor(@Param('format') format: string, @Res() res: Response) {
    return await this.vendorsService.exportVendor(format, res);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all vendor',
    description:
      'Mengambil daftar semua vendor dengan filter opsional limit, page, sort order, dan search.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  async findAllVendor(@Query() getVendorDto: GetVendorDto) {
    return await this.vendorsService.findAllVendor(getVendorDto);
  }

  @Get(':vendor_id')
  @ApiOperation({
    summary: 'Get one translation',
    description: 'Mengambil detail translation berdasarkan freelance_id.',
  })
  @AllowAnyRole()
  async findOneVendor(@Param('vendor_id') vendor_id: string) {
    return await this.vendorsService.findOneVendor({
      vendor_id: String(vendor_id),
    });
  }

  @Patch(':vendor_id')
  @ApiOperation({
    summary: 'Patch vendor',
    description: 'Mengedit data vendor berdasarkan vendor_id.',
  })
  @SetMetadata('permissions', ['Resource Manager:Vendor:Edit:Edit'])
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateVendor(
    @Param('vendor_id') vendor_id: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ) {
    // Convert list_rate to array if it's a string
    if (
      updateVendorDto.list_rate &&
      typeof updateVendorDto.list_rate === 'string'
    ) {
      updateVendorDto.list_rate = JSON.parse(updateVendorDto.list_rate);
    }

    return await this.vendorsService.updateVendor(vendor_id, updateVendorDto);
  }

  @Delete(':vendor_id')
  @ApiOperation({
    summary: 'Delete vendor',
    description: 'Menghapus data vendor berdasarkan vendor_id.',
  })
  @SetMetadata('permissions', ['Resource Manager:Vendor:Delete:Delete'])
  async removeVendor(@Param('vendor_id') vendor_id: string) {
    return await this.vendorsService.removeVendor({ vendor_id: vendor_id });
  }

  @Get(':vendor_id/attachments')
  @ApiOperation({
    summary: 'Get all attachment vendor',
    description:
      'Mengambil daftar attachment vendor berdasarkan vendor_id dengan filter opsional limit dan page.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @AllowAnyRole()
  async getAttachmentsVendor(
    @Param('vendor_id') vendor_id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.vendorsService.getAttachmentsVendor(
      vendor_id,
      page,
      limit,
    );
  }

  @Post(':vendor_id/attachments')
  @ApiOperation({
    summary: 'Upload attachments vendor',
    description:
      'Mengunggah attachment berupa image/pdf untuk vendor berdasarkan vendor_id.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Attachments berupa image/pdf untuk diunggah',
    required: true,
    schema: {
      type: 'object',
      properties: {
        attachment: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @SetMetadata('permissions', ['Resource Manager:Vendor:Edit:Edit'])
  @UseInterceptors(
    FilesInterceptor('attachment', 10, {
      storage: diskStorage({
        destination: './storage/attachment',
        filename: (req, file, cb) => {
          const generateRandomName = () => {
            return Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
          };

          const checkAndGenerateName = (name: string, cb: Function) => {
            const fileName = `${name}${extname(file.originalname)}`;
            fs.access(
              `./storage/attachment/${fileName}`,
              fs.constants.F_OK,
              (err) => {
                if (err) {
                  // file tidak duplikat, gunakan nama ini
                  cb(fileName);
                } else {
                  // file duplikat, generate nama baru dan cek lagi
                  checkAndGenerateName(generateRandomName(), cb);
                }
              },
            );
          };

          checkAndGenerateName(generateRandomName(), (fileName: string) => {
            cb(null, fileName);
          });
        },
      }),
    }),
  )
  async uploadAttachmentVendor(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2000000 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
        ],
      }),
    )
    attachment: Express.Multer.File[],
    @Param('vendor_id') vendor_id: string,
    @Request() req: any,
  ) {
    if (req.fileValidationError) {
      throw new BadRequestException(req.fileValidationError);
    }

    const newAttachment = attachment.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
    }));

    try {
      const attachments = await this.vendorsService.uploadAttachmentVendor(
        vendor_id,
        newAttachment,
      );
      return attachments;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      } else {
        throw new BadRequestException(
          'Failed to upload attachments.',
          error.message,
        );
      }
    }
  }

  @Public()
  @Get(':vendor_id/attachments/:attachment_name/download')
  @ApiOperation({
    summary: 'Download attachments vendor',
    description:
      'Mengunduh attachment berupa image/pdf untuk vendor berdasarkan vendor_id dan attachment_name.',
  })
  async downloadAttachmentVendor(
    @Param('vendor_id') vendor_id: string,
    @Param('attachment_name') attachment_name: string,
    @Res() res: Response,
  ) {
    return await this.vendorsService.downloadAttachmentVendor(
      vendor_id,
      attachment_name,
      res,
    );
  }

  @Delete(':vendor_id/attachments/:attachment_name')
  @ApiOperation({
    summary: 'Delete attachments vendor',
    description:
      'Menghapus attachment berupa image/pdf untuk vendor berdasarkan vendor_id dan attachment_name.',
  })
  @SetMetadata('permissions', ['Resource Manager:Vendor:Edit:Edit'])
  async removeAttachmentVendor(
    @Param('vendor_id') vendor_id: string,
    @Param('attachment_name') attachment_name: string,
  ) {
    return await this.vendorsService.removeAttachmentVendor(
      vendor_id,
      attachment_name,
    );
  }

  @Get(':vendor_id/ratings')
  @ApiOperation({
    summary: 'Get all submit rating vendor',
    description:
      'Mengambil daftar semua submit rating untuk vendor berdasarkan vendor_id dengan filter opsional limit, page, sort order, dan search.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  async getRatingsVendor(
    @Param('vendor_id') vendor_id: string,
    @Query() query: GetVendorDto,
  ) {
    return await this.vendorsService.getRatingsVendor(vendor_id, query);
  }

  @Get(':vendor_id/ratings/:rating_id')
  @ApiOperation({
    summary: 'Get one submit rating vendor',
    description:
      'Mengambil detail submit rating untuk vendor berdasarkan vendor_id dan submit_rating_id.',
  })
  @AllowAnyRole()
  async getRatingVendor(
    @Param('vendor_id') vendor_id: string,
    @Param('rating_id') rating_id: string,
  ) {
    return await this.vendorsService.getRatingVendor(vendor_id, rating_id);
  }

  @Post(':vendor_id/ratings')
  @ApiOperation({
    summary: 'Post submit rating vendor',
    description: 'Membuat submit rating untuk vendor berdasarkan vendor_id.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Submit rating data and optional file attachments',
    required: true,
    schema: {
      type: 'object',
      properties: {
        rating: { type: 'number' },
        project_name: { type: 'string' },
        review: { type: 'string' },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @SetMetadata('permissions', ['Resource Manager:Vendor:Rating:Create:Create'])
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './storage/file_submit_rating',
        filename: (req, file, cb) => {
          const generateRandomName = () => {
            return Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
          };

          const checkAndGenerateName = (name: string, cb: Function) => {
            const fileName = `${name}${extname(file.originalname)}`;
            fs.access(
              `./file_submit_rating/${fileName}`,
              fs.constants.F_OK,
              (err) => {
                if (err) {
                  // file tidak duplikat, gunakan nama ini
                  cb(fileName);
                } else {
                  // file duplikat, generate nama baru dan cek lagi
                  checkAndGenerateName(generateRandomName(), cb);
                }
              },
            );
          };

          checkAndGenerateName(generateRandomName(), (fileName: string) => {
            cb(null, fileName);
          });
        },
      }),
    }),
  )
  async createRatingVendor(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 2000000 })],
        fileIsRequired: false,
      }),
    )
    files: Express.Multer.File[] | undefined,
    @Param('vendor_id') vendor_id: string,
    @Body() data: Prisma.SubmitRatingCreateInput,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated.');
    }
    const file = files
      ? files.map((file) => ({
          filename: file.filename,
          originalname: file.originalname,
        }))
      : [];
    return await this.vendorsService.createRatingVendor(
      vendor_id,
      data,
      file,
      userId,
    );
  }

  @Public()
  @Get(':vendor_id/ratings/:rating_id/:filename/download')
  @ApiOperation({
    summary: 'Download file submit rating vendor',
    description:
      'Mengunduh file submit rating vendor berdasarkan vendor_id, submit_rating_id, dan filename.',
  })
  @AllowAnyRole()
  async downloadFileRatingVendor(
    @Param('vendor_id') vendor_id: string,
    @Param('rating_id') rating_id: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return await this.vendorsService.downloadFileRatingVendor(
      vendor_id,
      rating_id,
      filename,
      res,
    );
  }

  @Get(':vendor_id/pm-notes')
  @ApiOperation({
    summary: 'Get all pm-notes vendor',
    description:
      'Mengambil daftar semua pm-notes untuk vendor berdasarkan vendor_id dengan filter opsional limit, page, sort order, dan search.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  async getPmNotesVendor(
    @Param('vendor_id') vendor_id: string,
    @Query() query: GetVendorDto,
  ) {
    return await this.vendorsService.getPmNotesVendor(vendor_id, query);
  }

  @Get(':vendor_id/pm-notes/:pm_note_id')
  @ApiOperation({
    summary: 'Get one pm-notes vendor',
    description:
      'Mengambil detail pm-note untuk vendor berdasarkan vendor_id dan pm_notes_id.',
  })
  @AllowAnyRole()
  async getPmNoteVendor(
    @Param('vendor_id') vendor_id: string,
    @Param('pm_note_id') pm_note_id: string,
  ) {
    return await this.vendorsService.getPmNoteVendor(vendor_id, pm_note_id);
  }

  @Post(':vendor_id/pm-notes')
  @ApiOperation({
    summary: 'Post pm-notes translation',
    description: 'Membuat pm-notes untuk translation berdasarkan freelance_id.',
  })
  @ApiBody({
    description: 'PM-Notes data',
    required: true,
    schema: { properties: { note: { type: 'string' } } },
  })
  @SetMetadata('permissions', [
    'Resource Manager:Vendor:PM Notes:Create:Create',
  ])
  async createPmNoteVendor(
    @Request() req: any,
    @Param('vendor_id') vendor_id: string,
    @Body() data: Prisma.PMNotesCreateInput,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated.');
    }
    return await this.vendorsService.createPmNoteVendor(
      userId,
      vendor_id,
      data,
    );
  }

  @Patch(':vendor_id/pm-notes/:pm_note_id')
  @ApiOperation({
    summary: 'Approval pm-notes vendor',
    description:
      'Menyetujui pm-notes untuk vendor berdasarkan vendor_id dan pm_notes_id.',
  })
  @ApiBody({
    description: 'PM-Notes approval data',
    required: true,
    schema: {
      properties: {
        reply: { type: 'string' },
        status_approval: { type: 'enum', enum: ['Approved', 'Rejected'] },
      },
    },
  })
  @SetMetadata('permissions', [
    'Resource Manager:Vendor:PM Notes:Approve:Approve',
  ])
  async updatePmNoteVendor(
    @Param('vendor_id') vendor_id: string,
    @Param('pm_note_id') pm_note_id: string,
    @Body() data: Prisma.PMNotesUpdateInput,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated.');
    }
    return await this.vendorsService.updatePmNoteVendor(
      pm_note_id,
      vendor_id,
      data,
      userId,
    );
  }
}
