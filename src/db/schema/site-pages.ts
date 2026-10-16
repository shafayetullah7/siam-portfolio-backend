import { pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import {
  publishableSlugColumn,
  publishableStatusColumn,
  publishableTimestampsColumns,
  seoColumns,
} from './columns/publishable';
import { timestampsColumns } from './columns/timestamps';

export const sitePages = pgTable('site_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: publishableSlugColumn(),
  publishStatus: publishableStatusColumn(),
  ...publishableTimestampsColumns,
  ...seoColumns,
  title: varchar('title', { length: 300 }).notNull(),
  body: text('body').notNull().default(''),
  ...timestampsColumns,
});
