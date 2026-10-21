import {
  boolean,
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
import { media } from './media';
import { projects } from './projects';
import { publications } from './publications';
import { publishStatusEnum } from './site-pages';

export const researchThemeStatusEnum = pgEnum('research_theme_status', [
  'ongoing',
  'completed',
]);

export type ResearchCollaborator = {
  name: string;
  role?: string | null;
  url?: string | null;
};

export const researchThemeResourceTypeEnum = pgEnum(
  'research_theme_resource_type',
  ['code', 'data', 'demo', 'paper', 'other'],
);

export const researchThemes = pgTable('research_themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  title: varchar('title', { length: 300 }).notNull(),
  summary: text('summary').notNull(),
  themeStatus: researchThemeStatusEnum('theme_status')
    .notNull()
    .default('ongoing'),
  problem: text('problem').notNull().default(''),
  significance: text('significance'),
  objectives: text('objectives'),
  approach: text('approach'),
  findings: text('findings'),
  limitations: text('limitations'),
  futureWork: text('future_work'),
  tags: text('tags').array(),
  linkLabel: varchar('link_label', { length: 120 }),
  coverMediaId: uuid('cover_media_id').references(() => media.id, {
    onDelete: 'set null',
  }),
  sortOrder: integer('sort_order').notNull().default(0),
  featuredOnHome: boolean('featured_on_home').notNull().default(false),
  publishStatus: publishStatusEnum('publish_status').notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  seoTitle: varchar('seo_title', { length: 120 }),
  seoDescription: varchar('seo_description', { length: 320 }),
  collaborators: jsonb('collaborators').$type<ResearchCollaborator[]>(),
  acknowledgments: text('acknowledgments'),
  funding: text('funding'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const researchThemeResources = pgTable('research_theme_resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  themeId: uuid('theme_id')
    .notNull()
    .references(() => researchThemes.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  label: varchar('label', { length: 200 }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  resourceType: researchThemeResourceTypeEnum('resource_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const researchThemePublications = pgTable(
  'research_theme_publications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    themeId: uuid('theme_id')
      .notNull()
      .references(() => researchThemes.id, { onDelete: 'cascade' }),
    publicationId: uuid('publication_id')
      .notNull()
      .references(() => publications.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('research_theme_publications_theme_pub_unique').on(
      table.themeId,
      table.publicationId,
    ),
  ],
);

export const researchThemeProjects = pgTable(
  'research_theme_projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    themeId: uuid('theme_id')
      .notNull()
      .references(() => researchThemes.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('research_theme_projects_theme_project_unique').on(
      table.themeId,
      table.projectId,
    ),
  ],
);
