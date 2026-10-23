import { describe, expect, it } from 'vitest';
import {
  buildReadOnOpenPatch,
  buildStatusPatch,
} from './contact-message-status.rules';
import type { ContactMessageRow } from './contact.types';

const baseRow = (): ContactMessageRow =>
  ({
    id: 'msg-1',
    status: 'new',
    isRead: false,
    category: null,
    senderName: 'Ada',
    senderEmail: 'ada@example.com',
    affiliation: null,
    subject: null,
    body: 'Hi',
    consentGiven: true,
    consentTextVersion: null,
    submittedAt: new Date(),
    readAt: null,
    repliedAt: null,
    archivedAt: null,
    adminNotes: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as ContactMessageRow;

describe('contact-message-status.rules', () => {
  it('buildReadOnOpenPatch marks new messages read', () => {
    const now = new Date('2026-06-01T00:00:00Z');
    const patch = buildReadOnOpenPatch(baseRow(), now);
    expect(patch).toEqual({
      isRead: true,
      readAt: now,
      status: 'read',
    });
  });

  it('buildReadOnOpenPatch skips spam', () => {
    expect(
      buildReadOnOpenPatch({ ...baseRow(), status: 'spam' }),
    ).toBeNull();
  });

  it('buildStatusPatch sets repliedAt when status becomes replied', () => {
    const now = new Date('2026-06-02T00:00:00Z');
    const patch = buildStatusPatch(
      baseRow(),
      { status: 'replied' },
      now,
    );
    expect(patch.repliedAt).toEqual(now);
  });

  it('buildStatusPatch sets archivedAt when status becomes archived', () => {
    const now = new Date('2026-06-03T00:00:00Z');
    const patch = buildStatusPatch(
      baseRow(),
      { status: 'archived' },
      now,
    );
    expect(patch.archivedAt).toEqual(now);
  });
});
