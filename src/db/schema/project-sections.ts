import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const projectSectionKindEnum = pgEnum('project_section_kind', [
  'problem',
  'context',
  'responsibilities',
  'solution',
  'data_methods',
  'evaluation',
  'results',
  'limitations',
  'future_work',
  'custom',
]);

export const projectSections = pgTable(
  'project_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    kind: projectSectionKindEnum('kind').notNull().default('custom'),
    title: varchar('title', { length: 300 }),
    body: text('body').notNull().default(''),
  },
  (table) => [
    index('project_sections_project_sort_idx').on(
      table.projectId,
      table.sortOrder,
    ),
  ],
);
