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
import { articles } from './articles';

export const writingArticlePublications = pgTable(
  'writing_article_publications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    publicationId: uuid('publication_id')
      .notNull()
      .references(() => publications.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('writing_article_publications_unique').on(
      table.articleId,
      table.publicationId,
    ),
  ],
);

export const writingArticleProjects = pgTable(
  'writing_article_projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('writing_article_projects_unique').on(
      table.articleId,
      table.projectId,
    ),
  ],
);

export const writingArticleResearchThemes = pgTable(
  'writing_article_research_themes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    themeId: uuid('theme_id')
      .notNull()
      .references(() => researchThemes.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('writing_article_research_themes_unique').on(
      table.articleId,
      table.themeId,
    ),
  ],
);

export const writingArticleRelated = pgTable(
  'writing_article_related',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    relatedArticleId: uuid('related_article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('writing_article_related_unique').on(
      table.articleId,
      table.relatedArticleId,
    ),
  ],
);
