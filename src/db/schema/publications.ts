import {
  boolean,
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

export const publicationTypeEnum = pgEnum('publication_type', [
  'journal',
  'conference',
  'preprint',
  'workshop',
  'thesis',
  'other',
]);

export const publications = pgTable('publications', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  authorsShort: varchar('authors_short', { length: 300 }).notNull(),
  year: integer('year').notNull(),
  venue: varchar('venue', { length: 300 }).notNull(),
  significance: text('significance'),
  abstract: text('abstract'),
  publicationType: publicationTypeEnum('publication_type')
    .notNull()
    .default('other'),
  peerReviewed: boolean('peer_reviewed').notNull().default(false),
  doi: varchar('doi', { length: 200 }).unique(),
  publisherUrl: varchar('publisher_url', { length: 2000 }),
  featured: boolean('featured').notNull().default(false),
  featuredOnHome: boolean('featured_on_home').notNull().default(false),
  seoTitle: varchar('seo_title', { length: 500 }),
  seoDescription: text('seo_description'),
  ownerContribution: text('owner_contribution'),
  correctionNotice: text('correction_notice'),
  hideFromSearch: boolean('hide_from_search').notNull().default(false),
  pdfMediaId: uuid('pdf_media_id').references(() => media.id, {
    onDelete: 'set null',
  }),
  openAccess: boolean('open_access').notNull().default(false),
  pdfRightsGranted: boolean('pdf_rights_granted').notNull().default(false),
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
