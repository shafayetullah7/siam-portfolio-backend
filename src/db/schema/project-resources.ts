import { index, integer, pgEnum, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const projectResourceTypeEnum = pgEnum('project_resource_type', [
  'repo',
  'demo',
  'paper',
  'dataset',
  'model_card',
  'documentation',
  'video',
  'other',
]);

export const projectResources = pgTable(
  'project_resources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    resourceType: projectResourceTypeEnum('resource_type')
      .notNull()
      .default('other'),
    label: varchar('label', { length: 200 }).notNull(),
    url: varchar('url', { length: 2000 }).notNull(),
  },
  (table) => [
    index('project_resources_project_sort_idx').on(
      table.projectId,
      table.sortOrder,
    ),
  ],
);
