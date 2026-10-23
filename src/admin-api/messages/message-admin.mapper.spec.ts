import { describe, expect, it } from 'vitest';
import type { ContactMessageRow } from '../../domain/contact/contact.types';
import {
  bodySnippet,
  CONTACT_MESSAGE_BODY_SNIPPET_LENGTH,
  toMessageAdminListItem,
} from './message-admin.mapper';

const baseRow = {
  id: '00000000-0000-4000-8000-000000000099',
  status: 'new' as const,
  isRead: false,
  category: 'Collaboration',
  senderName: 'Ada',
  senderEmail: 'ada@example.com',
  affiliation: null,
  subject: null,
  body: 'Hello   world\n\nfrom Ada',
  consentGiven: true,
  consentTextVersion: null,
  submittedAt: new Date('2026-01-01T12:00:00.000Z'),
  readAt: null,
  repliedAt: null,
  archivedAt: null,
  adminNotes: null,
  metadata: null,
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  updatedAt: new Date('2026-01-01T12:00:00.000Z'),
} satisfies ContactMessageRow;

describe('message-admin.mapper', () => {
  it('normalizes whitespace in bodySnippet', () => {
    expect(bodySnippet(baseRow.body)).toBe('Hello world from Ada');
  });

  it('truncates long bodies in list items', () => {
    const longBody = 'a'.repeat(CONTACT_MESSAGE_BODY_SNIPPET_LENGTH + 10);
    const item = toMessageAdminListItem({ ...baseRow, body: longBody });
    expect(item.bodySnippet.length).toBe(CONTACT_MESSAGE_BODY_SNIPPET_LENGTH + 1);
    expect(item.bodySnippet.endsWith('…')).toBe(true);
    expect('body' in item).toBe(false);
  });
});
