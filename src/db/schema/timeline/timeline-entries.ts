import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { projects } from '../projects';
import { publications } from '../publications';
import { publishStatusEnum } from '../site-pages';

/** P09 recognition + P10 education/experience kinds (see achievements-timeline requirements §5.2). */
export const timelineEntryKindEnum = pgEnum('timeline_entry_kind', [
  'award',
  'competition',
  'scholarship_fellowship_grant',
  'certification',
  'recognition_service',
  'education',
  'research_experience',
  'industry_experience',
  'teaching_mentoring',
  'affiliation',
]);

/**
 * Month-level dates: store day 1 when the UI sends YYYY-MM (no separate year/month columns).
 */
export const timelineEntries = pgTable(
  'timeline_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: timelineEntryKindEnum('kind').notNull(),
    slug: varchar('slug', { length: 200 }),
    title: varchar('title', { length: 500 }).notNull(),
    subtitle: text('subtitle'),
    summary: text('summary'),
    organization: varchar('organization', { length: 500 }),
    location: varchar('location', { length: 300 }),
    startDate: date('start_date'),
    endDate: date('end_date'),
    isOngoing: boolean('is_ongoing').notNull().default(false),
    isCurrent: boolean('is_current'),
    proofUrl: varchar('proof_url', { length: 2000 }),
    rankOrPlacement: varchar('rank_or_placement', { length: 200 }),
    eventName: varchar('event_name', { length: 500 }),
    credentialId: varchar('credential_id', { length: 200 }),
    expiresAt: date('expires_at'),
    featured: boolean('featured').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    publicationId: uuid('publication_id').references(() => publications.id, {
      onDelete: 'set null',
    }),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    seoTitle: varchar('seo_title', { length: 500 }),
    seoDescription: text('seo_description'),
    hideFromSearch: boolean('hide_from_search').notNull().default(false),
    metadata: jsonb('metadata'),
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
  },
  (table) => [
    uniqueIndex('timeline_entries_slug_unique').on(table.slug),
    index('timeline_entries_publish_status_idx').on(table.publishStatus),
    index('timeline_entries_kind_sort_order_idx').on(table.kind, table.sortOrder),
    index('timeline_entries_kind_start_date_idx').on(table.kind, table.startDate),
  ],
);
