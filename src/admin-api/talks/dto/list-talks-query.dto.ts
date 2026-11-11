import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

export const LIST_TALKS_SORTS = [
  'updatedAtDesc',
  'startsAtDesc',
  'startsAtAsc',
  'titleAsc',
] as const;

const TALK_TYPES = [
  'invited_talk',
  'conference_talk',
  'poster',
  'workshop',
  'other',
] as const;

const TALK_ROLES = [
  'speaker',
  'panelist',
  'poster_presenter',
  'attendee',
  'organizer',
] as const;

export const listTalksQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  publishStatus: z.enum(PUBLISH_STATUSES).optional(),
  talkType: z.enum(TALK_TYPES).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.enum(LIST_TALKS_SORTS).optional(),
});

export type ListTalksQuery = z.infer<typeof listTalksQuerySchema>;

export { TALK_ROLES, TALK_TYPES };
