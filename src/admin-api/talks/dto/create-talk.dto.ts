import { z } from 'zod';
import { TALK_ROLES, TALK_TYPES } from './list-talks-query.dto';

const optionalText = z.string().max(10_000).optional().nullable();

export const createTalkBodySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(500),
  eventName: z.string().min(1).max(500),
  timezone: z.string().min(1).max(100),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional().nullable(),
  venue: z.string().max(500).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  isOnline: z.boolean().optional(),
  role: z.enum(TALK_ROLES).optional(),
  talkType: z.enum(TALK_TYPES).optional(),
  description: optionalText,
  sortOrder: z.coerce.number().int().min(0).max(10_000).optional(),
  hideFromSearch: z.boolean().optional(),
});

export type CreateTalkBody = z.infer<typeof createTalkBodySchema>;
