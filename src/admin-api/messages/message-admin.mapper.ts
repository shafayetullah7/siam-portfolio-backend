import type { ContactMessageRow } from '../../domain/contact/contact.types';
import type {
  MessageAdminDetail,
  MessageAdminListItem,
} from './dto/message-admin-response.dto';

export const CONTACT_MESSAGE_BODY_SNIPPET_LENGTH = 120;

export function bodySnippet(
  body: string,
  max = CONTACT_MESSAGE_BODY_SNIPPET_LENGTH,
): string {
  const normalized = body.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}…`;
}

export function toMessageAdminListItem(
  row: ContactMessageRow,
): MessageAdminListItem {
  return {
    id: row.id,
    senderName: row.senderName,
    senderEmail: row.senderEmail,
    category: row.category,
    status: row.status,
    isRead: row.isRead,
    submittedAt: row.submittedAt.toISOString(),
    bodySnippet: bodySnippet(row.body),
  };
}

export function toMessageAdminDetail(row: ContactMessageRow): MessageAdminDetail {
  return {
    id: row.id,
    status: row.status,
    isRead: row.isRead,
    category: row.category,
    senderName: row.senderName,
    senderEmail: row.senderEmail,
    affiliation: row.affiliation,
    subject: row.subject,
    body: row.body,
    consentGiven: row.consentGiven,
    consentTextVersion: row.consentTextVersion,
    submittedAt: row.submittedAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    repliedAt: row.repliedAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    adminNotes: row.adminNotes,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
