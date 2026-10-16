import { pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { timestampsColumns } from './columns/timestamps';

/** Phase 9 — singleton profile for About (P02). */
export const profile = pgTable('profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  headline: varchar('headline', { length: 300 }),
  shortBio: text('short_bio'),
  longBio: text('long_bio'),
  affiliation: varchar('affiliation', { length: 300 }),
  ...timestampsColumns,
});

/** Phase 9 — singleton homepage hero copy (P01). */
export const homepage = pgTable('homepage', {
  id: uuid('id').primaryKey().defaultRandom(),
  heroTitle: varchar('hero_title', { length: 500 }),
  heroSubtitle: text('hero_subtitle'),
  ...timestampsColumns,
});
