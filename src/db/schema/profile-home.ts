import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

/** Phase 9 — singleton profile for About (P02). */
export const profile = pgTable('profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  headline: varchar('headline', { length: 300 }),
  shortBio: text('short_bio'),
  longBio: text('long_bio'),
  affiliation: varchar('affiliation', { length: 300 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** Phase 9 — singleton homepage hero copy (P01). */
export const homepage = pgTable('homepage', {
  id: uuid('id').primaryKey().defaultRandom(),
  heroTitle: varchar('hero_title', { length: 500 }),
  heroSubtitle: text('hero_subtitle'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
