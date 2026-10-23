import { z } from 'zod';
import { CONTACT_MESSAGE_STATUSES } from '../../../domain/contact/contact-status';

const ADMIN_NOTES_MAX = 10_000;

export const updateMessageBodySchema = z
  .object({
    status: z.enum(CONTACT_MESSAGE_STATUSES).optional(),
    isRead: z.boolean().optional(),
    adminNotes: z.string().max(ADMIN_NOTES_MAX).nullable().optional(),
  })
  .refine(
    (body) =>
      body.status !== undefined ||
      body.isRead !== undefined ||
      body.adminNotes !== undefined,
    { message: 'At least one field is required' },
  );

export type UpdateMessageBody = z.infer<typeof updateMessageBodySchema>;
