import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

const SERVICE_TYPES = [
  'reviewing',
  'committee',
  'mentoring',
  'outreach',
  'editorial',
  'other',
] as const;

export const LIST_ACADEMIC_SERVICE_SORTS = [
  'updatedAtDesc',
  'sortOrderAsc',
  'startYearDesc',
] as const;

export const listAcademicServiceQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  publishStatus: z.enum(PUBLISH_STATUSES).optional(),
  serviceType: z.enum(SERVICE_TYPES).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.enum(LIST_ACADEMIC_SERVICE_SORTS).optional(),
});

export type ListAcademicServiceQuery = z.infer<typeof listAcademicServiceQuerySchema>;
