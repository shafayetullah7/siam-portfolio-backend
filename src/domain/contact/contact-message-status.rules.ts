import type { ContactMessageRow, ContactMessageUpdate } from './contact.types';

export function buildReadOnOpenPatch(
  row: ContactMessageRow,
  now: Date = new Date(),
): ContactMessageUpdate | null {
  if (row.status === 'spam' || row.isRead) {
    return null;
  }
  return {
    isRead: true,
    readAt: now,
    status: row.status === 'new' ? 'read' : row.status,
  };
}

export function buildStatusPatch(
  current: ContactMessageRow,
  patch: ContactMessageUpdate,
  now: Date = new Date(),
): ContactMessageUpdate {
  const merged: ContactMessageUpdate = { ...patch };

  if (patch.status === 'replied' && !current.repliedAt) {
    merged.repliedAt = now;
  }
  if (patch.status === 'archived' && !current.archivedAt) {
    merged.archivedAt = now;
  }
  if (patch.isRead === true && !current.readAt) {
    merged.readAt = now;
  }

  return merged;
}
