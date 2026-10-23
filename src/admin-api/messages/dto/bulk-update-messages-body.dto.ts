import { z } from 'zod';
import { CONTACT_MESSAGE_STATUSES } from '../../../domain/contact/contact-status';

export const BULK_UPDATE_MESSAGES_MAX_IDS = 100;

const bulkPatchSchema = z
  .object({
    status: z.enum(CONTACT_MESSAGE_STATUSES).optional(),
    isRead: z.boolean().optional(),
  })
  .refine(
    (patch) => patch.status !== undefined || patch.isRead !== undefined,
    { message: 'At least one patch field is required' },
  );

export const bulkUpdateMessagesBodySchema = z.object({
  ids: z
    .array(z.uuid())
    .min(1)
    .max(BULK_UPDATE_MESSAGES_MAX_IDS),
  patch: bulkPatchSchema,
});

export type BulkUpdateMessagesBody = z.infer<
  typeof bulkUpdateMessagesBodySchema
>;
