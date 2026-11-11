import { z } from 'zod';

const RESOURCE_TYPES = [
  'slides',
  'video',
  'poster',
  'event_page',
  'other',
] as const;

const resourceRowSchema = z.object({
  resourceType: z.enum(RESOURCE_TYPES).optional(),
  label: z.string().min(1).max(200),
  url: z
    .string()
    .min(1)
    .max(2000)
    .regex(/^https:\/\/.+/i),
});

export const putTalkResourcesBodySchema = z.object({
  resources: z.array(resourceRowSchema).max(20),
});

export type PutTalkResourcesBody = z.infer<typeof putTalkResourcesBodySchema>;
