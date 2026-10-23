import type { contactMessages } from '../../db/schema/contact/contact-messages';
import type { ContactMessageStatus } from './contact-status';

export type ContactMessageRow = typeof contactMessages.$inferSelect;
export type ContactMessageInsert = typeof contactMessages.$inferInsert;

export type ContactMessageListQuery = {
  status?: ContactMessageStatus;
  isRead?: boolean;
  category?: string;
  q?: string;
  /** When true, omit rows with status `spam`. */
  excludeSpam?: boolean;
  page?: number;
  limit?: number;
};

export type AdminContactMessageListQuery = ContactMessageListQuery;

export type AdminUpdateContactMessageInput = ContactMessageUpdate;

export type ContactMessageUpdate = Partial<
  Pick<
    ContactMessageInsert,
    | 'status'
    | 'isRead'
    | 'readAt'
    | 'repliedAt'
    | 'archivedAt'
    | 'adminNotes'
  >
>;
