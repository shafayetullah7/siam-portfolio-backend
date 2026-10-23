import { z } from 'zod';

export const publishTimelineEntryBodySchema = z
  .object({
    confirmWarnings: z.boolean().optional(),
  })
  .default({});

export type PublishTimelineEntryBody = z.infer<
  typeof publishTimelineEntryBodySchema
>;
