import {
  index,
  integer,
  pgEnum,
  pgTable,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { publications } from './publications';

export const publicationSupplementKindEnum = pgEnum(
  'publication_supplement_kind',
  ['code', 'data', 'slides', 'poster', 'demo', 'repository', 'other'],
);

export const publicationSupplements = pgTable(
  'publication_supplements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicationId: uuid('publication_id')
      .notNull()
      .references(() => publications.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    label: varchar('label', { length: 200 }).notNull(),
    url: varchar('url', { length: 2000 }).notNull(),
    kind: publicationSupplementKindEnum('kind').notNull().default('other'),
  },
  (table) => [
    index('publication_supplements_publication_sort_idx').on(
      table.publicationId,
      table.sortOrder,
    ),
  ],
);
