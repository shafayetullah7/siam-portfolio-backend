import { index, integer, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { talkResourceTypeEnum, talks } from './talks';

export const talkResources = pgTable(
  'talk_resources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    talkId: uuid('talk_id')
      .notNull()
      .references(() => talks.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    resourceType: talkResourceTypeEnum('resource_type')
      .notNull()
      .default('other'),
    label: varchar('label', { length: 200 }).notNull(),
    url: varchar('url', { length: 2000 }).notNull(),
  },
  (table) => [
    index('talk_resources_talk_sort_idx').on(table.talkId, table.sortOrder),
  ],
);
