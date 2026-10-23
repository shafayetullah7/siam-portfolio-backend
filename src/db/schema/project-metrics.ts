import { index, integer, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const projectMetrics = pgTable(
  'project_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    name: varchar('name', { length: 300 }).notNull(),
    value: varchar('value', { length: 200 }).notNull(),
    unit: varchar('unit', { length: 100 }),
    baseline: varchar('baseline', { length: 200 }),
    notes: text('notes'),
    caption: text('caption'),
  },
  (table) => [
    index('project_metrics_project_sort_idx').on(
      table.projectId,
      table.sortOrder,
    ),
  ],
);
