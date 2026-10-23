import type { ContactMessageStatus } from '../../../domain/contact/contact-status';
import type { ContactMessageMetadata } from '../../../db/schema/contact/contact.types';

export type MessageAdminListItem = {
  id: string;
  senderName: string;
  senderEmail: string;
  category: string | null;
  status: ContactMessageStatus;
  isRead: boolean;
  submittedAt: string;
  bodySnippet: string;
};

export type MessageAdminDetail = {
  id: string;
  status: ContactMessageStatus;
  isRead: boolean;
  category: string | null;
  senderName: string;
  senderEmail: string;
  affiliation: string | null;
  subject: string | null;
  body: string;
  consentGiven: boolean;
  consentTextVersion: string | null;
  submittedAt: string;
  readAt: string | null;
  repliedAt: string | null;
  archivedAt: string | null;
  adminNotes: string | null;
  metadata: ContactMessageMetadata | null;
  createdAt: string;
  updatedAt: string;
};
