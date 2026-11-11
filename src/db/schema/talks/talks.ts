import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { publishStatusEnum } from '../site-pages';

export const talkRoleEnum = pgEnum('talk_role', [
  'speaker',
  'panelist',
  'poster_presenter',
  'attendee',
  'organizer',
]);

export const talkTypeEnum = pgEnum('talk_type', [
  'invited_talk',
  'conference_talk',
  'poster',
  'workshop',
  'other',
]);

export const talkResourceTypeEnum = pgEnum('talk_resource_type', [
  'slides',
  'video',
  'poster',
  'event_page',
  'other',
]);

export const talks = pgTable(
  'talks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    title: varchar('title', { length: 500 }).notNull(),
    eventName: varchar('event_name', { length: 500 }).notNull(),
    venue: varchar('venue', { length: 500 }),
    location: varchar('location', { length: 500 }),
    isOnline: boolean('is_online').notNull().default(false),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    timezone: varchar('timezone', { length: 100 }).notNull(),
    role: talkRoleEnum('role').notNull().default('speaker'),
    talkType: talkTypeEnum('talk_type').notNull().default('other'),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
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
    index('talks_publish_status_idx').on(table.publishStatus),
    index('talks_starts_at_idx').on(table.startsAt),
  ],
);
