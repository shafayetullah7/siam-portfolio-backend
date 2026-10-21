import { Injectable } from '@nestjs/common';
import type { Express } from 'express';
import { MediaService } from '../../domain/media/media.service';
import { mapMediaAdmin } from './admin-media.mapper';
import type { CreateMediaPlaceholderBody } from './dto/create-media-placeholder.dto';
import type { MediaListQuery } from './dto/media-list-query.dto';
import type { MediaAdminResponse } from './dto/media-admin-response.dto';
import type { MediaListResponse } from './dto/media-list-response.dto';
import type { UpdateMediaMetadataBody } from './dto/update-media-metadata.dto';

@Injectable()
export class AdminMediaService {
  constructor(private readonly media: MediaService) {}

  async list(query: MediaListQuery): Promise<MediaListResponse> {
    const result = await this.media.listFiltered(query);
    return {
      items: result.items.map(mapMediaAdmin),
      meta: result.meta,
    };
  }

  async getById(id: string): Promise<MediaAdminResponse> {
    const row = await this.media.findById(id);
    return mapMediaAdmin(row);
  }

  async createPlaceholder(body: CreateMediaPlaceholderBody) {
    const row = await this.media.createPlaceholder(body);
    return mapMediaAdmin(row);
  }

  async uploadFile(
    adminId: string,
    file: Express.Multer.File,
    imageOnly: boolean,
  ): Promise<MediaAdminResponse> {
    const row = await this.media.uploadFile(adminId, file, { imageOnly });
    return mapMediaAdmin(row);
  }

  async updateMetadata(
    id: string,
    body: UpdateMediaMetadataBody,
  ): Promise<MediaAdminResponse> {
    const row = await this.media.updateMetadata(id, body);
    return mapMediaAdmin(row);
  }

  async delete(id: string): Promise<void> {
    await this.media.deleteById(id);
  }
}
