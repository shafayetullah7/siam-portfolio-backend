import { integer, pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { media } from './media';
import { projectSections } from './project-sections';

export const projectSectionMedia = pgTable(
  'project_section_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => projectSections.id, { onDelete: 'cascade' }),
    mediaId: uuid('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'restrict' }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    uniqueIndex('project_section_media_section_media_unique').on(
      table.sectionId,
      table.mediaId,
    ),
  ],
);
