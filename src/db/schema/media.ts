import { integer, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { timestampsColumns } from './columns/timestamps';

/** Phase 7 — Cloudinary wiring later; rows created for dashboard counts. */
export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: varchar('url', { length: 1000 }).notNull(),
  publicKey: varchar('public_key', { length: 300 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  altText: varchar('alt_text', { length: 500 }),
  usesCount: integer('uses_count').notNull().default(0),
  ...timestampsColumns,
});
