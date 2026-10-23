export const CONTACT_MESSAGE_STATUSES = [
  'new',
  'read',
  'replied',
  'archived',
  'spam',
] as const;

export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number];
