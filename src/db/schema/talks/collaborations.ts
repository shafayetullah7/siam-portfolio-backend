import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { media } from '../media';
import { publishStatusEnum } from '../site-pages';

export const collaborations = pgTable('collaborations', {
  id: uuid('id').primaryKey().defaultRandom(),
  partnerName: varchar('partner_name', { length: 500 }).notNull(),
  institution: varchar('institution', { length: 500 }),
  logoMediaId: uuid('logo_media_id').references(() => media.id, {
    onDelete: 'set null',
  }),
  role: varchar('role', { length: 500 }),
  period: varchar('period', { length: 200 }),
  summary: text('summary').notNull(),
  outcomes: text('outcomes'),
  sortOrder: integer('sort_order').notNull().default(0),
  publishStatus: publishStatusEnum('publish_status').notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
