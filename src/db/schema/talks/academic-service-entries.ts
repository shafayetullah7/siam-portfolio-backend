import { integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { publishStatusEnum } from '../site-pages';

export const academicServiceTypeEnum = pgEnum('academic_service_type', [
  'reviewing',
  'committee',
  'mentoring',
  'outreach',
  'editorial',
  'other',
]);

export const academicServiceEntries = pgTable('academic_service_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceType: academicServiceTypeEnum('service_type').notNull().default('other'),
  organization: varchar('organization', { length: 500 }).notNull(),
  roleTitle: varchar('role_title', { length: 500 }).notNull(),
  startYear: integer('start_year'),
  endYear: integer('end_year'),
  proofUrl: varchar('proof_url', { length: 2000 }),
  summary: text('summary'),
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
