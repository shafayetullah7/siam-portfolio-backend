import { z } from 'zod';
import { timelineImageRoleSchema } from '../../../admin-api/timeline/dto/timeline-image-role.schema';

export const timelinePublicImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  caption: z.string().nullable(),
  sortOrder: z.number().int(),
  imageRole: timelineImageRoleSchema.nullable().optional(),
});

export type TimelinePublicImageDto = z.infer<typeof timelinePublicImageSchema>;
