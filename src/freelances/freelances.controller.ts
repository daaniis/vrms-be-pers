/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Patch,
  Delete,
  UseInterceptors,
  Res,
  UploadedFiles,
  NotFoundException,
  BadRequestException,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UploadedFile,
  UseGuards,
  UnauthorizedException,
  SetMetadata,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GetAllDto } from './dto/get-all.dto';
import { Prisma } from '@prisma/client';
import { TranslationService } from './translation.service';
import { NonTranslationService } from './non-translation.service';
import {
  AnyFilesInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { type Response } from 'express';
import * as fs from 'fs';
import {
  CreateTranslationDto,
  CreateNonTranslationDto,
} from './dto/create-freelance.dto';
import {
  UpdateTranslationDto,
  UpdateNonTranslationDto,
} from './dto/update-freelance.dto';
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

@ApiTags('Freelance')
@ApiBearerAuth()
@Controller('freelances')
@UseGuards(PublicGuard)
export class FreelancesController {
  constructor(
    private readonly translationService: TranslationService,
    private readonly nonTranslationService: NonTranslationService,
  ) {}

  // Translation
  @Post('translation')
  @ApiOperation({
    summary: 'Post translation',
    description: 'Membuat freelance translation.',
  })
  @SetMetadata('permissions', ['Resource Manager:Translation:Create:Create'])
  @UsePipes(new ValidationPipe({ transform: true }))
  async createTranslation(@Body() createTranslationDto: CreateTranslationDto) {
    // Convert tools to array if it's a string
    if (typeof createTranslationDto.tools === 'string') {
      createTranslationDto.tools = JSON.parse(createTranslationDto.tools);
    }

    // Convert list_rate to array if it's a string and set default if undefined
    if (typeof createTranslationDto.list_rate === 'string') {
      createTranslationDto.list_rate = JSON.parse(
        createTranslationDto.list_rate,
      );
    } else if (!createTranslationDto.list_rate) {
      createTranslationDto.list_rate = []; // Berikan nilai default kosong jika list_rate tidak ada
    }

    return await this.translationService.createTranslation(
      createTranslationDto,
    );
  }

  @Post('translation/import')
  @ApiOperation({
    summary: 'Import translation',
    description: 'Mengimport file excel translation.',
  })
  @SetMetadata('permissions', ['Resource Manager:Translation:Import:Import'])
  @SetMetadata('skipDefaultResponse', true)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
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
  async importTranslation(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.translationService.importTranslation(file);
  }

  @Public()
  @Get('translation/export/:format')
  @ApiOperation({
    summary: 'Export translation',
    description: 'Mengexport file excel translation dengan format csv/xlsx.',
  })
  @AllowAnyRole()
  async exportTranslation(
    @Param('format') format: string,
    @Res() res: Response,
  ) {
    return await this.translationService.exportTranslation(format, res);
  }

  @Get('translation')
  @ApiOperation({
    summary: 'Get all translation',
    description:
      'Mengambil daftar semua translation dengan filter opsional limit, page, sort order, dan search.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  async findAllTranslation(@Query() getTranslationDto: GetAllDto) {
    return await this.translationService.findAllTranslation(getTranslationDto);
  }

  @Get('translation/:freelance_id')
  @ApiOperation({
    summary: 'Get one translation',
    description: 'Mengambil detail translation berdasarkan freelance_id.',
  })
  @AllowAnyRole()
  async findOneTranslation(@Param('freelance_id') freelance_id: string) {
    return await this.translationService.findOneTranslation({
      freelance_id: String(freelance_id),
    });
  }

  @Patch('translation/:freelance_id')
  @ApiOperation({
    summary: 'Patch translation',
    description: 'Mengedit data translation berdasarkan freelance_id.',
  })
  @SetMetadata('permissions', ['Resource Manager:Translation:Edit:Edit'])
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateTranslation(
    @Param('freelance_id') freelance_id: string,
    @Body() updateTranslationDto: UpdateTranslationDto,
  ) {
    // Convert list_rate to array if it's a string
    if (
      updateTranslationDto.list_rate &&
      typeof updateTranslationDto.list_rate === 'string'
    ) {
      updateTranslationDto.list_rate = JSON.parse(
        updateTranslationDto.list_rate,
      );
    }

    return await this.translationService.updateTranslation(
      freelance_id,
      updateTranslationDto,
    );
  }

  @Delete('translation/:freelance_id')
  @ApiOperation({
    summary: 'Delete translation',
    description: 'Menghapus data translation berdasarkan freelance_id.',
  })
  @SetMetadata('permissions', ['Resource Manager:Translation:Delete:Delete'])
  async removeTranslation(@Param('freelance_id') freelance_id: string) {
    return await this.translationService.removeTranslation({
      freelance_id: freelance_id,
    });
  }

  @Get('translation/:freelance_id/attachments')
  @ApiOperation({
    summary: 'Get all attachment translation',
    description:
      'Mengambil daftar attachment translation berdasarkan freelance_id dengan filter opsional limit dan page.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @AllowAnyRole()
  async getAttachmentsTranslation(
    @Param('freelance_id') freelance_id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.translationService.getAttachmentsTranslation(
      freelance_id,
      page,
      limit,
    );
  }

  @Post('translation/:freelance_id/attachments')
  @ApiOperation({
    summary: 'Upload attachments translation',
    description:
      'Mengunggah attachment berupa image/pdf untuk translation berdasarkan freelance_id.',
  })
  @SetMetadata('permissions', ['Resource Manager:Translation:Edit:Edit'])
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
  async uploadAttachmentTranslation(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2000000 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
        ],
      }),
    )
    attachment: Express.Multer.File[],
    @Param('freelance_id') freelance_id: string,
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
      const attachments =
        await this.translationService.uploadAttachmentTranslation(
          freelance_id,
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
  @Get('translation/:freelance_id/attachments/:attachment_name/download')
  @ApiOperation({
    summary: 'Download attachments translation',
    description:
      'Mengunduh attachment berupa image/pdf untuk translation berdasarkan freelance_id dan attachment_name.',
  })
  async downloadAttachmentTranslation(
    @Param('freelance_id') freelance_id: string,
    @Param('attachment_name') attachment_name: string,
    @Res() res: Response,
  ) {
    return await this.translationService.downloadAttachmentNameTranslation(
      freelance_id,
      attachment_name,
      res,
    );
  }

  @Delete('translation/:freelance_id/attachments/:attachment_name')
  @ApiOperation({
    summary: 'Delete attachments translation',
    description:
      'Menghapus attachment berupa image/pdf untuk translation berdasarkan freelance_id dan attachment_name.',
  })
  @SetMetadata('permissions', ['Resource Manager:Translation:Edit:Edit'])
  async deleteAttachmentTranslation(
    @Param('freelance_id') freelance_id: string,
    @Param('attachment_name') attachment_name: string,
  ) {
    return await this.translationService.deleteAttachmentTranslation(
      freelance_id,
      attachment_name,
    );
  }

  @Get('translation/:freelance_id/ratings')
  @ApiOperation({
    summary: 'Get all submit rating translation',
    description:
      'Mengambil daftar semua submit rating untuk translation berdasarkan freelance_id dengan filter opsional limit, page, sort order, dan search.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  async getRatingsTranslation(
    @Param('freelance_id') freelance_id: string,
    @Query() getSubmitRatingTranslationDto: GetAllDto,
  ) {
    return await this.translationService.getRatingsTranslation(
      freelance_id,
      getSubmitRatingTranslationDto,
    );
  }

  @Get('translation/:freelance_id/ratings/:submit_rating_id')
  @ApiOperation({
    summary: 'Get one submit rating translation',
    description:
      'Mengambil detail submit rating untuk translation berdasarkan freelance_id dan submit_rating_id.',
  })
  @AllowAnyRole()
  async getOneRatingTranslation(
    @Param('submit_rating_id') submit_rating_id: string,
    @Param('freelance_id') freelance_id: string,
  ) {
    return await this.translationService.getOneRatingTranslation(
      submit_rating_id,
      freelance_id,
    );
  }

  @Post('translation/:freelance_id/ratings')
  @ApiOperation({
    summary: 'Post submit rating translation',
    description:
      'Membuat submit rating untuk translation berdasarkan freelance_id.',
  })
  @SetMetadata('permissions', [
    'Resource Manager:Translation:Rating:Create:Create',
  ])
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
              `./storage/file_submit_rating/${fileName}`,
              fs.constants.F_OK,
              (err) => {
                if (err) {
                  cb(fileName);
                } else {
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
  async createRatingTranslation(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 2000000 })],
        fileIsRequired: false,
      }),
    )
    files: Express.Multer.File[] | undefined,
    @Param('freelance_id') freelance_id: string,
    @Body() data: Prisma.SubmitRatingCreateInput,
    @Request() req: any,
  ) {
    const file = files
      ? files.map((file) => ({
          filename: file.filename,
          originalname: file.originalname,
        }))
      : [];

    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated.');
    }

    return await this.translationService.createRatingTranslation(
      freelance_id,
      data,
      file,
      userId,
    );
  }

  @Public()
  @Get('translation/:freelance_id/ratings/:submit_rating_id/:filename/download')
  @ApiOperation({
    summary: 'Download file submit rating translation',
    description:
      'Mengunduh file submit rating translation berdasarkan freelance_id, submit_rating_id, dan filename.',
  })
  @AllowAnyRole()
  async downloadFileRatingTranslation(
    @Param('freelance_id') freelance_id: string,
    @Param('submit_rating_id') submit_rating_id: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return await this.translationService.downloadFileRatingTranslation(
      freelance_id,
      submit_rating_id,
      filename,
      res,
    );
  }

  @Get('translation/:freelance_id/pm-notes')
  @ApiOperation({
    summary: 'Get all pm-notes translation',
    description:
      'Mengambil daftar semua pm-notes untuk translation berdasarkan freelance_id dengan filter opsional limit, page, sort order, dan search.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  async getPMNotesTranslation(
    @Param('freelance_id') freelance_id: string,
    @Query() getPMNotesTranslationDto: GetAllDto,
  ) {
    return await this.translationService.getPMNotesTranslation(
      freelance_id,
      getPMNotesTranslationDto,
    );
  }

  @Get('translation/:freelance_id/pm-notes/:pm_notes_id')
  @ApiOperation({
    summary: 'Get one pm-notes translation',
    description:
      'Mengambil detail pm-note untuk translation berdasarkan freelance_id dan pm_notes_id.',
  })
  @AllowAnyRole()
  async getOnePMNoteTranslation(
    @Param('freelance_id') freelance_id: string,
    @Param('pm_notes_id') pm_notes_id: string,
  ) {
    return await this.translationService.getOnePMNoteTranslation(
      pm_notes_id,
      freelance_id,
    );
  }

  @Post('translation/:freelance_id/pm-notes')
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
    'Resource Manager:Translation:PM Notes:Create:Create',
  ])
  async createPMNoteTranslation(
    @Request() req: any,
    @Param('freelance_id') freelance_id: string,
    @Body() data: Prisma.PMNotesCreateInput,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated.');
    }

    return await this.translationService.createPMNoteTranslation(
      userId,
      freelance_id,
      data,
    );
  }

  @Patch('translation/:freelance_id/pm-notes/:pm_notes_id')
  @ApiOperation({
    summary: 'Approval pm-notes translation',
    description:
      'Menyetujui pm-notes untuk translation berdasarkan freelance_id dan pm_notes_id.',
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
    'Resource Manager:Translation:PM Notes:Approve:Approve',
  ])
  async approvePMNoteTranslation(
    @Param('freelance_id') freelance_id: string,
    @Param('pm_notes_id') pm_notes_id: string,
    @Body() data: Prisma.PMNotesUpdateInput,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated.');
    }

    return await this.translationService.approvePMNoteTranslation(
      pm_notes_id,
      freelance_id,
      data,
      userId,
    );
  }

  // Non-Translation
  @Post('non-translation')
  @ApiOperation({
    summary: 'Post non-translation',
    description: 'Membuat freelance non-translation.',
  })
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   description: 'Non Translation data',
  //   type: CreateNonTranslationDto,
  // })
  @SetMetadata('permissions', [
    'Resource Manager:Non Translation:Create:Create',
  ])
  @UsePipes(new ValidationPipe({ transform: true }))
  async createNonTranslation(
    @Body() createNonTranslationDto: CreateNonTranslationDto,
  ) {
    // Convert tools to array if it's a string
    if (typeof createNonTranslationDto.tools === 'string') {
      createNonTranslationDto.tools = JSON.parse(createNonTranslationDto.tools);
    }

    // Convert list_rate to array if it's a string and set default if undefined
    if (typeof createNonTranslationDto.list_rate === 'string') {
      createNonTranslationDto.list_rate = JSON.parse(
        createNonTranslationDto.list_rate,
      );
    } else if (!createNonTranslationDto.list_rate) {
      createNonTranslationDto.list_rate = []; // Berikan nilai default kosong jika list_rate tidak ada
    }

    return await this.nonTranslationService.createNonTranslation(
      createNonTranslationDto,
    );
  }

  @Post('non-translation/import')
  @ApiOperation({
    summary: 'Import non-translation',
    description: 'Mengimport file excel non-translation.',
  })
  @SetMetadata('permissions', [
    'Resource Manager:Non Translation:Import:Import',
  ])
  @SetMetadata('skipDefaultResponse', true)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
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
  async importNonTranslation(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.nonTranslationService.importNonTranslation(file);
  }

  @Public()
  @ApiOperation({
    summary: 'Export non-translation',
    description:
      'Mengexport file excel non-translation dengan format csv/xlsx.',
  })
  @Get('non-translation/export/:format')
  @AllowAnyRole()
  async exportNonTranslation(
    @Param('format') format: string,
    @Res() res: Response,
  ) {
    return await this.nonTranslationService.exportNonTranslation(format, res);
  }

  @Get('non-translation')
  @ApiOperation({
    summary: 'Get all non-translation',
    description:
      'Mengambil daftar semua non-translation dengan filter opsional limit, page, sort order, dan search.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  async findAllNonTranslation(@Query() getNonTranslationDto: GetAllDto) {
    return await this.nonTranslationService.findAllNonTranslation(
      getNonTranslationDto,
    );
  }

  @Get('non-translation/:freelance_id')
  @ApiOperation({
    summary: 'Get one non-translation',
    description: 'Mengambil detail non-translation berdasarkan freelance_id.',
  })
  @AllowAnyRole()
  async findOneNonTranslation(@Param('freelance_id') freelance_id: string) {
    return await this.nonTranslationService.findOneNonTranslation({
      freelance_id: String(freelance_id),
    });
  }

  @Patch('non-translation/:freelance_id')
  @ApiOperation({
    summary: 'Patch non-translation',
    description: 'Mengedit data non-translation berdasarkan freelance_id.',
  })
  @SetMetadata('permissions', ['Resource Manager:Non Translation:Edit:Edit'])
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateNonTranslation(
    @Param('freelance_id') freelance_id: string,
    @Body() updateNonTranslationDto: UpdateNonTranslationDto,
  ) {
    // Convert list_rate to array if it's a string
    if (
      updateNonTranslationDto.list_rate &&
      typeof updateNonTranslationDto.list_rate === 'string'
    ) {
      updateNonTranslationDto.list_rate = JSON.parse(
        updateNonTranslationDto.list_rate,
      );
    }

    return await this.nonTranslationService.updateNonTranslation(
      freelance_id,
      updateNonTranslationDto,
    );
  }

  @Delete('non-translation/:freelance_id')
  @ApiOperation({
    summary: 'Delete non-translation',
    description: 'Menghapus data non-translation berdasarkan freelance_id.',
  })
  @SetMetadata('permissions', [
    'Resource Manager:Non Translation:Delete:Delete',
  ])
  async removeNonTranslation(@Param('freelance_id') freelance_id: string) {
    return await this.nonTranslationService.removeNonTranslation({
      freelance_id: freelance_id,
    });
  }

  @Get('non-translation/:freelance_id/attachments')
  @ApiOperation({
    summary: 'Get all attachment non-translation',
    description:
      'Mengambil daftar attachment non-translation berdasarkan freelance_id dengan filter opsional limit dan page.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @AllowAnyRole()
  async getAttachmentsNonTranslation(
    @Param('freelance_id') freelance_id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.nonTranslationService.getAttachmentsNonTranslation(
      freelance_id,
      page,
      limit,
    );
  }

  @Post('non-translation/:freelance_id/attachments')
  @ApiOperation({
    summary: 'Upload attachments non-translation',
    description:
      'Mengunggah attachment berupa image/pdf untuk non-translation berdasarkan freelance_id.',
  })
  @SetMetadata('permissions', ['Resource Manager:Non Translation:Edit:Edit'])
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
  async uploadAttachmentNonTranslation(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2000000 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
        ],
      }),
    )
    attachment: Express.Multer.File[],
    @Param('freelance_id') freelance_id: string,
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
      const attachments =
        await this.nonTranslationService.uploadAttachmentNonTranslation(
          freelance_id,
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
  @Get('non-translation/:freelance_id/attachments/:attachment_name/download')
  @ApiOperation({
    summary: 'Download attachments non-translation',
    description:
      'Mengunduh attachment berupa image/pdf untuk non-translation berdasarkan freelance_id dan attachment_name.',
  })
  @Public()
  async downloadAttachmentNonTranslation(
    @Param('freelance_id') freelance_id: string,
    @Param('attachment_name') attachment_name: string,
    @Res() res: Response,
  ) {
    return await this.nonTranslationService.downloadAttachmentNameNonTranslation(
      freelance_id,
      attachment_name,
      res,
    );
  }

  @Delete('non-translation/:freelance_id/attachments/:attachment_name')
  @ApiOperation({
    summary: 'Delete attachments non-translation',
    description:
      'Menghapus attachment berupa image/pdf untuk non-translation berdasarkan freelance_id dan attachment_name.',
  })
  @SetMetadata('permissions', ['Resource Manager:Non Translation:Edit:Edit'])
  async deleteAttachmentNonTranslation(
    @Param('freelance_id') freelance_id: string,
    @Param('attachment_name') attachment_name: string,
  ) {
    return await this.nonTranslationService.deleteAttachmentNonTranslation(
      freelance_id,
      attachment_name,
    );
  }

  @Get('non-translation/:freelance_id/ratings')
  @ApiOperation({
    summary: 'Get all submit rating non-translation',
    description:
      'Mengambil daftar semua submit rating untuk non-translation berdasarkan freelance_id dengan filter opsional limit, page, sort order, dan search.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  async getRatingsNonTranslation(
    @Param('freelance_id') freelance_id: string,
    @Query() getSubmitRatingNonTranslationDto: GetAllDto,
  ) {
    return await this.nonTranslationService.getRatingsNonTranslation(
      freelance_id,
      getSubmitRatingNonTranslationDto,
    );
  }

  @Get('non-translation/:freelance_id/ratings/:submit_rating_id')
  @ApiOperation({
    summary: 'Get one submit rating non-translation',
    description:
      'Mengambil detail submit rating untuk non-translation berdasarkan freelance_id dan submit_rating_id.',
  })
  @AllowAnyRole()
  async getOneRatingNonTranslation(
    @Param('submit_rating_id') submit_rating_id: string,
    @Param('freelance_id') freelance_id: string,
  ) {
    return await this.nonTranslationService.getOneRatingNonTranslation(
      freelance_id,
      submit_rating_id,
    );
  }

  @Post('non-translation/:freelance_id/ratings')
  @ApiOperation({
    summary: 'Post submit rating non-translation',
    description:
      'Membuat submit rating untuk non-translation berdasarkan freelance_id.',
  })
  @SetMetadata('permissions', [
    'Resource Manager:Non Translation:Rating:Create:Create',
  ])
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
              `./storage/file_submit_rating/${fileName}`,
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
  async createRatingNonTranslation(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 2000000 })],
        fileIsRequired: false,
      }),
    )
    files: Express.Multer.File[] | undefined,
    @Param('freelance_id') freelance_id: string,
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

    return await this.nonTranslationService.createRatingNonTranslation(
      freelance_id,
      data,
      file,
      userId,
    );
  }

  @Public()
  @Get(
    'non-translation/:freelance_id/ratings/:submit_rating_id/:filename/download',
  )
  @ApiOperation({
    summary: 'Download file submit rating non-translation',
    description:
      'Mengunduh file submit rating non-translation berdasarkan freelance_id, submit_rating_id, dan filename.',
  })
  @AllowAnyRole()
  async downloadFileRatingNonTranslation(
    @Param('freelance_id') freelance_id: string,
    @Param('submit_rating_id') submit_rating_id: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return await this.nonTranslationService.downloadFileRatingNonTranslation(
      freelance_id,
      submit_rating_id,
      filename,
      res,
    );
  }

  @Get('non-translation/:freelance_id/pm-notes')
  @ApiOperation({
    summary: 'Get all pm-notes non-translation',
    description:
      'Mengambil daftar semua pm-notes untuk non-translation berdasarkan freelance_id dengan filter opsional limit, page, sort order, dan search.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['newest', 'oldest'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @AllowAnyRole()
  async getPMNotesNonTranslation(
    @Param('freelance_id') freelance_id: string,
    @Query() getPMNotesNonTranslationDto: GetAllDto,
  ) {
    return await this.nonTranslationService.getPMNotesNonTranslation(
      freelance_id,
      getPMNotesNonTranslationDto,
    );
  }

  @Get('non-translation/:freelance_id/pm-notes/:pm_notes_id')
  @ApiOperation({
    summary: 'Get one pm-notes non-translation',
    description:
      'Mengambil detail pm-note untuk non-translation berdasarkan freelance_id dan pm_notes_id.',
  })
  @AllowAnyRole()
  async getOnePMNoteNonTranslation(
    @Param('freelance_id') freelance_id: string,
    @Param('pm_notes_id') pm_notes_id: string,
  ) {
    return await this.nonTranslationService.getOnePMNoteNonTranslation(
      pm_notes_id,
      freelance_id,
    );
  }

  @Post('non-translation/:freelance_id/pm-notes')
  @ApiOperation({
    summary: 'Post pm-notes non-translation',
    description:
      'Membuat pm-notes untuk non-translation berdasarkan freelance_id.',
  })
  @ApiBody({
    description: 'PM-Notes data',
    required: true,
    schema: { properties: { note: { type: 'string' } } },
  })
  @SetMetadata('permissions', [
    'Resource Manager:Non Translation:PM Notes:Create:Create',
  ])
  async createPMNoteNonTranslation(
    @Request() req: any,
    @Param('freelance_id') freelance_id: string,
    @Body() data: Prisma.PMNotesCreateInput,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated.');
    }
    return await this.nonTranslationService.createPMNoteNonTranslation(
      userId,
      freelance_id,
      data,
    );
  }

  @Patch('non-translation/:freelance_id/pm-notes/:pm_notes_id')
  @ApiOperation({
    summary: 'Approval pm-notes non-translation',
    description:
      'Menyetujui pm-notes untuk non-translation berdasarkan freelance_id dan pm_notes_id.',
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
    'Resource Manager:Non Translation:PM Notes:Approve:Approve',
  ])
  async approvePMNoteNonTranslation(
    @Param('freelance_id') freelance_id: string,
    @Param('pm_notes_id') pm_notes_id: string,
    @Body() data: Prisma.PMNotesUpdateInput,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated.');
    }
    return await this.nonTranslationService.approvePMNoteNonTranslation(
      pm_notes_id,
      freelance_id,
      data,
      userId,
    );
  }
}
