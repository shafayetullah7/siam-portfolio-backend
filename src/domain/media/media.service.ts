import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
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

type MediaRow = typeof media.$inferSelect;

@Injectable()
export class MediaService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async list() {
    return this.db.select().from(media);
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
