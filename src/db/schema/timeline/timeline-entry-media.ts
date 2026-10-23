import { integer, pgEnum, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { media } from '../media';
import { timelineEntries } from './timeline-entries';

export const timelineImageRoleEnum = pgEnum('timeline_image_role', [
  'certificate',
  'photo',
  'badge',
  'logo',
]);

export const timelineEntryMedia = pgTable(
  'timeline_entry_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timelineEntryId: uuid('timeline_entry_id')
      .notNull()
      .references(() => timelineEntries.id, { onDelete: 'cascade' }),
    mediaId: uuid('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'restrict' }),
    sortOrder: integer('sort_order').notNull().default(0),
    caption: text('caption'),
    imageRole: timelineImageRoleEnum('image_role'),
  },
  (table) => [
    uniqueIndex('timeline_entry_media_entry_media_unique').on(
      table.timelineEntryId,
      table.mediaId,
    ),
  ],
);
