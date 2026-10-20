import {
  Body,
  Controller,
  Get,
  Post,
  SerializeOptions,
  StandardSchemaSerializerInterceptor,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Express } from 'express';
import { memoryStorage } from 'multer';
import { apiSuccess } from '../../common/http/api-response';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import {
  MEDIA_IMAGE_UPLOAD_MAX_BYTES,
  MEDIA_UPLOAD_MAX_BYTES,
} from '../../domain/media/media-upload.constants';
import { AdminMediaService } from './admin-media.service';
import {
  createMediaPlaceholderBodySchema,
  type CreateMediaPlaceholderBody,
} from './dto/create-media-placeholder.dto';
import { mediaAdminResponseSchema } from './dto/media-admin-response.dto';

@ApiTags('admin-media')
@Controller('admin/media')
@UseGuards(AdminAuthGuard)
export class AdminMediaController {
  constructor(private readonly media: AdminMediaService) {}

  @Get()
  @ApiOperation({ summary: 'List media library' })
  async list() {
    return apiSuccess(await this.media.list());
  }

  @Post('placeholder')
  @ApiOperation({ summary: 'Create placeholder media row (dev/seeds)' })
  @UseInterceptors(StandardSchemaSerializerInterceptor)
  @SerializeOptions({ schema: mediaAdminResponseSchema })
  async createPlaceholder(
    @Body({ schema: createMediaPlaceholderBodySchema })
    body: CreateMediaPlaceholderBody,
  ) {
    return apiSuccess(await this.media.createPlaceholder(body));
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload file (images or PDF, max 10MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MEDIA_UPLOAD_MAX_BYTES },
    }),
    StandardSchemaSerializerInterceptor,
  )
  @SerializeOptions({ schema: mediaAdminResponseSchema })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentAdmin() admin: { sub: string },
  ) {
    return apiSuccess(await this.media.uploadFile(admin.sub, file, false));
  }

  @Post('upload/image')
  @ApiOperation({ summary: 'Upload image only (max 3MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MEDIA_IMAGE_UPLOAD_MAX_BYTES },
    }),
    StandardSchemaSerializerInterceptor,
  )
  @SerializeOptions({ schema: mediaAdminResponseSchema })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentAdmin() admin: { sub: string },
  ) {
    return apiSuccess(await this.media.uploadFile(admin.sub, file, true));
  }
}
