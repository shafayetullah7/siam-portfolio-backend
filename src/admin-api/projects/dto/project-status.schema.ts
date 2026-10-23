import { z } from 'zod';

export const projectStatusSchema = z.enum([
  'ongoing',
  'completed',
  'maintained',
  'archived',
]);
