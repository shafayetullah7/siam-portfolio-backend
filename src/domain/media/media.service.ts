import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { media } from '../../db/schema/media';

/** Phase 7 — Cloudinary upload wired later. */
@Injectable()
export class MediaService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async list() {
    return this.db.select().from(media);
  }

  async createPlaceholder(input: {
    url: string;
    publicKey: string;
    mimeType?: string;
    altText?: string;
  }) {
    const [row] = await this.db.insert(media).values(input).returning();
    return row;
  }
}
