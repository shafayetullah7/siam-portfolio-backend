import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { media } from '../media';
import { publishStatusEnum } from '../site-pages';
import { writingSeries } from './writing-series';

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    title: varchar('title', { length: 500 }).notNull(),
    subtitle: text('subtitle'),
    summary: text('summary').notNull(),
    body: text('body').notNull().default(''),
    tags: text('tags').array(),
    seriesId: uuid('series_id').references(() => writingSeries.id, {
      onDelete: 'set null',
    }),
    seriesSortOrder: integer('series_sort_order'),
    coverMediaId: uuid('cover_media_id').references(() => media.id, {
      onDelete: 'set null',
    }),
    byline: text('byline'),
    readingTimeMinutes: integer('reading_time_minutes'),
    wordCount: integer('word_count'),
    featuredOnHub: boolean('featured_on_hub').notNull().default(false),
    featured: boolean('featured').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    materiallyUpdatedAt: timestamp('materially_updated_at', {
      withTimezone: true,
    }),
    seoTitle: varchar('seo_title', { length: 500 }),
    seoDescription: text('seo_description'),
    hideFromSearch: boolean('hide_from_search').notNull().default(false),
    publishStatus: publishStatusEnum('publish_status')
      .notNull()
      .default('draft'),
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
  },
  (table) => [
    index('articles_publish_status_idx').on(table.publishStatus),
    index('articles_published_at_idx').on(table.publishedAt),
  ],
);
