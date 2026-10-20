import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { admins } from './auth';

/** Reusable file metadata (A10). Cloudinary public_id lives in cloudinary_media. */
export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileName: varchar('file_name', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  size: integer('size').notNull().default(0),
  url: varchar('url', { length: 1000 }).notNull(),
  alt: varchar('alt', { length: 500 }),
  caption: text('caption'),
  license: text('license'),
  usesCount: integer('uses_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const cloudinaryMedia = pgTable('cloudinary_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaId: uuid('media_id')
    .notNull()
    .unique()
    .references(() => media.id, { onDelete: 'cascade' }),
  publicKey: varchar('public_key', { length: 300 }).notNull().unique(),
});

export const adminUploadMedia = pgTable('admin_upload_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaId: uuid('media_id')
    .notNull()
    .references(() => media.id, { onDelete: 'cascade' }),
  adminId: uuid('admin_id')
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
});
