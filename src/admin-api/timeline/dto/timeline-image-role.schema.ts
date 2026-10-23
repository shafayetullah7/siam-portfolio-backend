import { z } from 'zod';

export const timelineImageRoleSchema = z.enum([
  'certificate',
  'photo',
  'badge',
  'logo',
]);

export type TimelineImageRoleDto = z.infer<typeof timelineImageRoleSchema>;
