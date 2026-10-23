/** Admin-only metadata stored on `contact_messages.metadata` (MSG1). */
export type ContactMessageMetadata = {
  ip?: string;
  userAgent?: string;
  honeypotTriggered?: boolean;
  turnstile?: { success: boolean; errorCodes?: string[] };
  locale?: string;
  /** Dev seed idempotency (`db/seed/contact.catalog.ts`). */
  seedKey?: string;
};
