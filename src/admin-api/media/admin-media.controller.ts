import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Express } from 'express';
import { memoryStorage } from 'multer';
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
import { mediaIdParamSchema } from './dto/media-id-params.dto';
import {
  mediaListQuerySchema,
  type MediaListQuery,
} from './dto/media-list-query.dto';
import {
  updateMediaMetadataBodySchema,
  type UpdateMediaMetadataBody,
} from './dto/update-media-metadata.dto';

@ApiTags('admin-media')
@Controller('admin/media')
@UseGuards(AdminAuthGuard)
export class AdminMediaController {
  constructor(private readonly media: AdminMediaService) {}

  @Get()
  @ApiOperation({ summary: 'List media library (filtered, paginated)' })
  async list(@Query({ schema: mediaListQuerySchema }) query: MediaListQuery) {
    return await this.media.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media by id' })
  async getById(@Param('id', { schema: mediaIdParamSchema }) id: string) {
    return await this.media.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update media metadata (alt, caption, license)' })
  async updateMetadata(
    @Param('id', { schema: mediaIdParamSchema }) id: string,
    @Body({ schema: updateMediaMetadataBodySchema })
    body: UpdateMediaMetadataBody,
  ) {
    return await this.media.updateMetadata(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media (blocked when in use)' })
  async delete(@Param('id', { schema: mediaIdParamSchema }) id: string) {
    await this.media.delete(id);
    return null;
  }

  @Post('placeholder')
  @ApiOperation({ summary: 'Create placeholder media row (dev/seeds)' })
  async createPlaceholder(
    @Body({ schema: createMediaPlaceholderBodySchema })
    body: CreateMediaPlaceholderBody,
  ) {
    return await this.media.createPlaceholder(body);
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
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentAdmin() admin: { sub: string },
  ) {
    return await this.media.uploadFile(admin.sub, file, false);
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
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentAdmin() admin: { sub: string },
  ) {
    return await this.media.uploadFile(admin.sub, file, true);
  }
}
