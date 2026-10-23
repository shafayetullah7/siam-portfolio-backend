import {
  index,
  integer,
  pgTable,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { publications } from './publications';

export const publicationAuthors = pgTable(
  'publication_authors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicationId: uuid('publication_id')
      .notNull()
      .references(() => publications.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    name: varchar('name', { length: 200 }).notNull(),
    affiliation: varchar('affiliation', { length: 500 }),
    orcid: varchar('orcid', { length: 50 }),
  },
  (table) => [
    index('publication_authors_publication_sort_idx').on(
      table.publicationId,
      table.sortOrder,
    ),
  ],
);
