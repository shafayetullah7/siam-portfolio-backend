import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { media } from './media';
import { publishStatusEnum } from './site-pages';

export const projectTypeEnum = pgEnum('project_type', [
  'research_prototype',
  'production',
  'open_source',
  'coursework',
  'competition',
  'other',
]);

export const projectStatusEnum = pgEnum('project_status', [
  'ongoing',
  'completed',
  'maintained',
  'archived',
]);

export const evaluationMaturityEnum = pgEnum('evaluation_maturity', [
  'verified',
  'provisional',
  'experimental',
]);

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  summary: text('summary').notNull(),
  tags: text('tags').array(),
  projectType: projectTypeEnum('project_type').notNull().default('other'),
  projectStatus: projectStatusEnum('project_status')
    .notNull()
    .default('completed'),
  evaluationMaturity: evaluationMaturityEnum('evaluation_maturity')
    .notNull()
    .default('provisional'),
  ownerRole: text('owner_role'),
  ownerContribution: text('owner_contribution'),
  resultTeaser: text('result_teaser'),
  periodStart: date('period_start'),
  periodEnd: date('period_end'),
  coverMediaId: uuid('cover_media_id').references(() => media.id, {
    onDelete: 'set null',
  }),
  featured: boolean('featured').notNull().default(false),
  featuredOnHome: boolean('featured_on_home').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  seoTitle: varchar('seo_title', { length: 500 }),
  seoDescription: text('seo_description'),
  hideFromSearch: boolean('hide_from_search').notNull().default(false),
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
