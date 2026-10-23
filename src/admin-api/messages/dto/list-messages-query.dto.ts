import { z } from 'zod';
import { CONTACT_MESSAGE_STATUSES } from '../../../domain/contact/contact-status';

export const listMessagesQuerySchema = z.object({
  status: z.enum(CONTACT_MESSAGE_STATUSES).optional(),
  isRead: z.coerce.boolean().optional(),
  category: z.string().trim().min(1).max(100).optional(),
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  excludeSpam: z.coerce.boolean().optional(),
});

export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
