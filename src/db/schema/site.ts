import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { media } from './media';

export const siteSettings = pgTable('site_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteName: varchar('site_name', { length: 200 }).notNull().default('SIAM'),
  defaultMetaDescription: varchar('default_meta_description', {
    length: 320,
  }),
  footerText: text('footer_text'),
  researchHubIntro: text('research_hub_intro'),
  projectsHubIntro: text('projects_hub_intro'),
  writingHubIntro: text('writing_hub_intro'),
  achievementsHubIntro: text('achievements_hub_intro'),
  faviconUrl: varchar('favicon_url', { length: 500 }),
  faviconMediaId: uuid('favicon_media_id').references(() => media.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const navItems = pgTable('nav_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: varchar('label', { length: 100 }).notNull(),
  path: varchar('path', { length: 300 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
