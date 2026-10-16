import { pgEnum, timestamp, varchar } from 'drizzle-orm/pg-core';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

export const publishStatusEnum = pgEnum('publish_status', PUBLISH_STATUSES);

export const publishableSlugColumn = () =>
  varchar('slug', { length: 200 }).notNull().unique();

export const publishableStatusColumn = () =>
  publishStatusEnum('publish_status').notNull().default('draft');

export const publishableTimestampsColumns = {
  publishedAt: timestamp('published_at', { withTimezone: true }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
};

export const seoColumns = {
  seoTitle: varchar('seo_title', { length: 120 }),
  seoDescription: varchar('seo_description', { length: 320 }),
};
