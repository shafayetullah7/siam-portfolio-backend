import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

/** Phase 7 — Cloudinary wiring later; rows created for dashboard counts. */
export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: varchar('url', { length: 1000 }).notNull(),
  publicKey: varchar('public_key', { length: 300 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  altText: varchar('alt_text', { length: 500 }),
  usesCount: integer('uses_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
