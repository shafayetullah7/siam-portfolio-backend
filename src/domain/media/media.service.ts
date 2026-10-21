import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, count, desc, eq, ilike, inArray, type SQL } from 'drizzle-orm';
import type { Express } from 'express';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  buildCloudinaryUploadOptions,
  CLOUDINARY_FOLDER_IMAGES,
  CLOUDINARY_FOLDER_MEDIA,
} from '../../libs/cloudinary/cloudinary-upload.options';
import { CloudinaryService } from '../../libs/cloudinary/cloudinary.service';
import {
  adminUploadMedia,
  cloudinaryMedia,
  media,
} from '../../db/schema/media';
import { buildPaginatedResponse } from '../../common/pagination/paginated-response';
import type { MediaListQuery, MediaListResult, MediaRow } from './media-list.types';
import { MEDIA_IMAGE_MIME_TYPES } from './media-upload.constants';
import { validateUploadFile } from './validate-upload-file';

export type CreateMediaPlaceholderInput = {
  url: string;
  publicKey: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  alt?: string;
  adminId?: string;
};

type PersistMediaInput = {
  adminId?: string;
  fileName: string;
  mimeType?: string;
  size: number;
  url: string;
  publicKey: string;
  alt?: string;
};

export type UpdateMediaMetadataInput = {
  alt?: string | null;
  caption?: string | null;
  license?: string | null;
};

@Injectable()
export class MediaService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async listFiltered(query: MediaListQuery): Promise<MediaListResult> {
    const conditions: SQL[] = [];
    if (query.q) {
      conditions.push(ilike(media.fileName, `%${query.q}%`));
    }
    if (query.mime) {
      conditions.push(eq(media.mimeType, query.mime));
    }
    if (query.imagesOnly) {
      conditions.push(
        inArray(media.mimeType, [...MEDIA_IMAGE_MIME_TYPES]),
      );
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (query.page - 1) * query.limit;

    const [countRow] = await this.db
      .select({ total: count() })
      .from(media)
      .where(where);

    const items = await this.db
      .select()
      .from(media)
      .where(where)
      .orderBy(desc(media.createdAt))
      .limit(query.limit)
      .offset(offset);

    const total = Number(countRow?.total ?? 0);
    return buildPaginatedResponse(items, {
      page: query.page,
      limit: query.limit,
      total,
    });
  }

  async findById(id: string): Promise<MediaRow> {
    const [row] = await this.db
      .select()
      .from(media)
      .where(eq(media.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Media not found');
    }
    return row;
  }

  async assertImageMediaId(id: string): Promise<MediaRow> {
    const row = await this.findById(id);
    const mime = row.mimeType;
    if (
      !mime ||
      !(MEDIA_IMAGE_MIME_TYPES as readonly string[]).includes(mime)
    ) {
      throw new BadRequestException(
        'Cover must be an image from the media library',
      );
    }
    return row;
  }

  async updateMetadata(
    id: string,
    patch: UpdateMediaMetadataInput,
  ): Promise<MediaRow> {
    await this.findById(id);
    const [updated] = await this.db
      .update(media)
      .set({
        ...(patch.alt !== undefined ? { alt: patch.alt } : {}),
        ...(patch.caption !== undefined ? { caption: patch.caption } : {}),
        ...(patch.license !== undefined ? { license: patch.license } : {}),
      })
      .where(eq(media.id, id))
      .returning();
    return updated;
  }

  async deleteById(id: string): Promise<void> {
    const row = await this.findById(id);
    if (row.usesCount > 0) {
      throw new ForbiddenException(
        'This file is in use and cannot be deleted.',
      );
    }

    const [cloudRow] = await this.db
      .select({ publicKey: cloudinaryMedia.publicKey })
      .from(cloudinaryMedia)
      .where(eq(cloudinaryMedia.mediaId, id))
      .limit(1);

    if (!cloudRow) {
      throw new NotFoundException('Media not found');
    }

    await this.db.delete(media).where(eq(media.id, id));
    await this.cloudinary.deleteFile(cloudRow.publicKey);
  }

  /** P6 — increment when content references media. */
  async incrementUsage(_mediaId: string, _count = 1): Promise<void> {
    // stub
  }

  /** P6 — decrement when content detaches media. */
  async decrementUsage(_mediaId: string, _count = 1): Promise<void> {
    // stub
  }

  async createPlaceholder(input: CreateMediaPlaceholderInput) {
    const fileName =
      input.fileName?.trim() ||
      input.publicKey.split('/').pop() ||
      'placeholder';

    return this.db.transaction(async (tx) =>
      this.persistUploadedMedia(tx, {
        adminId: input.adminId,
        fileName,
        mimeType: input.mimeType,
        size: input.size ?? 0,
        url: input.url,
        publicKey: input.publicKey,
        alt: input.alt,
      }),
    );
  }

  async uploadFile(
    adminId: string,
    file: Express.Multer.File,
    opts: { imageOnly: boolean },
  ): Promise<MediaRow> {
    const validated = validateUploadFile(file, opts.imageOnly);
    const mimeType = validated.mimetype;
    const isPdf = mimeType === 'application/pdf';
    const folder = opts.imageOnly ? CLOUDINARY_FOLDER_IMAGES : CLOUDINARY_FOLDER_MEDIA;
    const resourceType = isPdf ? 'raw' : 'image';

    const uploadOptions = buildCloudinaryUploadOptions({
      folder,
      resourceType,
      mimeType,
    });

    const uploaded = await this.cloudinary.uploadBuffer(
      validated.buffer,
      uploadOptions,
    );

    try {
      return await this.db.transaction(async (tx) =>
        this.persistUploadedMedia(tx, {
          adminId,
          fileName: validated.originalname || 'upload',
          mimeType,
          size: uploaded.bytes,
          url: uploaded.secureUrl,
          publicKey: uploaded.publicId,
        }),
      );
    } catch (error) {
      await this.cloudinary.deleteFile(uploaded.publicId).catch(() => undefined);
      throw error;
    }
  }

  private async persistUploadedMedia(
    tx: Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0],
    input: PersistMediaInput,
  ): Promise<MediaRow> {
    const [row] = await tx
      .insert(media)
      .values({
        fileName: input.fileName,
        url: input.url,
        mimeType: input.mimeType,
        size: input.size,
        alt: input.alt,
      })
      .returning();

    await tx.insert(cloudinaryMedia).values({
      mediaId: row.id,
      publicKey: input.publicKey,
    });

    if (input.adminId) {
      await tx.insert(adminUploadMedia).values({
        mediaId: row.id,
        adminId: input.adminId,
      });
    }

    return row;
  }
}
