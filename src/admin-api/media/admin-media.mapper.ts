import type { media } from '../../db/schema/media';
import type { MediaAdminResponse } from './dto/media-admin-response.dto';

type MediaRow = typeof media.$inferSelect;

export function mapMediaAdmin(row: MediaRow): MediaAdminResponse {
  return {
    id: row.id,
    fileName: row.fileName,
    url: row.url,
    mimeType: row.mimeType,
    size: row.size,
    alt: row.alt,
    caption: row.caption,
    license: row.license,
    usesCount: row.usesCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
