import { Injectable } from '@nestjs/common';
import type { Express } from 'express';
import { MediaService } from '../../domain/media/media.service';
import { mapMediaAdmin } from './admin-media.mapper';
import type { CreateMediaPlaceholderBody } from './dto/create-media-placeholder.dto';
import type { MediaAdminResponse } from './dto/media-admin-response.dto';

@Injectable()
export class AdminMediaService {
  constructor(private readonly media: MediaService) {}

  async list(): Promise<MediaAdminResponse[]> {
    const rows = await this.media.list();
    return rows.map(mapMediaAdmin);
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
}
