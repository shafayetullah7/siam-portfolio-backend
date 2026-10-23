import { z } from 'zod';
import { timelineEntryKindSchema } from './timeline-entry-kind.schema';

const longText = z.string().max(100_000).optional().nullable();
const dateString = z.string().max(20).optional().nullable();
const optionalSlug = z
  .union([
    z.literal(''),
    z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  ])
  .optional()
  .nullable()
  .transform((value) => (value === '' ? null : value ?? null));

export const createTimelineEntryBodySchema = z.object({
  kind: timelineEntryKindSchema,
  title: z.string().min(1).max(500),
  slug: optionalSlug,
  subtitle: longText,
  summary: longText,
  organization: z.string().max(500).optional().nullable(),
  location: z.string().max(300).optional().nullable(),
  startDate: dateString,
  endDate: dateString,
  isOngoing: z.boolean().optional(),
  isCurrent: z.boolean().nullable().optional(),
  proofUrl: z.string().max(2000).optional().nullable(),
  rankOrPlacement: z.string().max(200).optional().nullable(),
  eventName: z.string().max(500).optional().nullable(),
  credentialId: z.string().max(200).optional().nullable(),
  expiresAt: dateString,
  featured: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(10_000).optional(),
  publicationId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  seoTitle: z.string().max(500).optional().nullable(),
  seoDescription: longText,
  hideFromSearch: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateTimelineEntryBody = z.infer<typeof createTimelineEntryBodySchema>;
