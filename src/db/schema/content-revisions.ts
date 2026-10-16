import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const contentRevisions = pgTable('content_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 64 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  snapshot: jsonb('snapshot').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
