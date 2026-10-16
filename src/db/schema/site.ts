import { boolean, integer, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { timestampsColumns } from './columns/timestamps';

export const siteSettings = pgTable('site_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteName: varchar('site_name', { length: 200 }).notNull().default('SIAM'),
  defaultMetaDescription: varchar('default_meta_description', {
    length: 320,
  }),
  footerText: text('footer_text'),
  faviconUrl: varchar('favicon_url', { length: 500 }),
  ...timestampsColumns,
});

export const navItems = pgTable('nav_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: varchar('label', { length: 100 }).notNull(),
  path: varchar('path', { length: 300 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
  ...timestampsColumns,
});
