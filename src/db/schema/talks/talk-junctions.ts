import {
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { projects } from '../projects';
import { publications } from '../publications';
import { researchThemes } from '../research';
import { talks } from './talks';

export const talkPublications = pgTable(
  'talk_publications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    talkId: uuid('talk_id')
      .notNull()
      .references(() => talks.id, { onDelete: 'cascade' }),
    publicationId: uuid('publication_id')
      .notNull()
      .references(() => publications.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('talk_publications_unique').on(
      table.talkId,
      table.publicationId,
    ),
  ],
);

export const talkProjects = pgTable(
  'talk_projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    talkId: uuid('talk_id')
      .notNull()
      .references(() => talks.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('talk_projects_unique').on(table.talkId, table.projectId),
  ],
);

export const talkResearchThemes = pgTable(
  'talk_research_themes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    talkId: uuid('talk_id')
      .notNull()
      .references(() => talks.id, { onDelete: 'cascade' }),
    themeId: uuid('theme_id')
      .notNull()
      .references(() => researchThemes.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('talk_research_themes_unique').on(table.talkId, table.themeId),
  ],
);
