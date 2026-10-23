import { z } from 'zod';
import { timelineEntryKindSchema } from '../../../admin-api/timeline/dto/timeline-entry-kind.schema';
import { timelinePublicImageSchema } from './timeline-public-image.dto';

export const timelinePublicCardSchema = z.object({
  id: z.string().uuid(),
  kind: timelineEntryKindSchema,
  title: z.string(),
  subtitle: z.string().nullable(),
  organization: z.string().nullable(),
  location: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isOngoing: z.boolean(),
  featured: z.boolean(),
  proofUrl: z.string().nullable(),
  href: z.string().optional(),
  images: z.array(timelinePublicImageSchema),
});

export type TimelinePublicCardDto = z.infer<typeof timelinePublicCardSchema>;
