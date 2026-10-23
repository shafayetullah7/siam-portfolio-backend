import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { ContactMessageMetadata } from './contact.types';

export const contactMessageStatusEnum = pgEnum('contact_message_status', [
  'new',
  'read',
  'replied',
  'archived',
  'spam',
]);

export const contactMessages = pgTable(
  'contact_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    status: contactMessageStatusEnum('status').notNull().default('new'),
    isRead: boolean('is_read').notNull().default(false),
    category: varchar('category', { length: 100 }),
    senderName: varchar('sender_name', { length: 200 }).notNull(),
    senderEmail: varchar('sender_email', { length: 320 }).notNull(),
    affiliation: varchar('affiliation', { length: 200 }),
    subject: varchar('subject', { length: 300 }),
    body: text('body').notNull(),
    consentGiven: boolean('consent_given').notNull().default(false),
    consentTextVersion: varchar('consent_text_version', { length: 64 }),
    submittedAt: timestamp('submitted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    readAt: timestamp('read_at', { withTimezone: true }),
    repliedAt: timestamp('replied_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    adminNotes: text('admin_notes'),
    metadata: jsonb('metadata').$type<ContactMessageMetadata>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('contact_messages_status_idx').on(table.status),
    index('contact_messages_is_read_idx').on(table.isRead),
    index('contact_messages_submitted_at_idx').on(table.submittedAt),
  ],
);
