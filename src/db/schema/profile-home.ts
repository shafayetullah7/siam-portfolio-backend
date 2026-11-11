import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type {
  HomeCollaborationCtaRow,
  HomeCurrentlyWorkingOnRow,
  HomeHighlightRow,
  HomeSectionConfigRow,
  ProfileExpertiseRow,
  ProfileScholarlyLink,
} from './profile-home-json.types';
import { media } from './media';
import { publishStatusEnum } from './site-pages';

/** Phase 9 — singleton profile for About (P02). */
export const profile = pgTable('profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  headline: varchar('headline', { length: 300 }),
  displayName: varchar('display_name', { length: 200 }),
  professionalTitle: varchar('professional_title', { length: 300 }),
  contactEmail: varchar('contact_email', { length: 320 }),
  shortBio: text('short_bio'),
  longBio: text('long_bio'),
  affiliation: varchar('affiliation', { length: 300 }),
  affiliationRole: varchar('affiliation_role', { length: 300 }),
  affiliationOrganization: varchar('affiliation_organization', { length: 300 }),
  affiliationLocation: varchar('affiliation_location', { length: 300 }),
  portraitMediaId: uuid('portrait_media_id').references(() => media.id, {
    onDelete: 'set null',
  }),
  scholarlyProfiles: jsonb('scholarly_profiles').$type<ProfileScholarlyLink[]>(),
  researchStatement: text('research_statement'),
  expertise: jsonb('expertise').$type<ProfileExpertiseRow>(),
  collaborationInterests: text('collaboration_interests'),
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

/** Phase 9 — singleton homepage hero copy (P01). */
export const homepage = pgTable('homepage', {
  id: uuid('id').primaryKey().defaultRandom(),
  heroTitle: varchar('hero_title', { length: 500 }),
  heroSubtitle: text('hero_subtitle'),
  heroDescriptor: varchar('hero_descriptor', { length: 500 }),
  heroPositioning: text('hero_positioning'),
  statusBadge: varchar('status_badge', { length: 80 }),
  primaryCtaLabel: varchar('primary_cta_label', { length: 120 }),
  primaryCtaHref: varchar('primary_cta_href', { length: 500 }),
  secondaryCtaLabel: varchar('secondary_cta_label', { length: 120 }),
  secondaryCtaHref: varchar('secondary_cta_href', { length: 500 }),
  heroMediaId: uuid('hero_media_id').references(() => media.id, {
    onDelete: 'set null',
  }),
  sections: jsonb('sections').$type<HomeSectionConfigRow[]>(),
  highlights: jsonb('highlights').$type<HomeHighlightRow[]>(),
  currentlyWorkingOn: jsonb('currently_working_on').$type<HomeCurrentlyWorkingOnRow>(),
  collaborationCta: jsonb('collaboration_cta').$type<HomeCollaborationCtaRow>(),
  profiles: jsonb('profiles').$type<ProfileScholarlyLink[]>(),
  seoTitle: varchar('seo_title', { length: 120 }),
  seoDescription: varchar('seo_description', { length: 320 }),
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
