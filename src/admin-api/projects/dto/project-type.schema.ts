import { z } from 'zod';

export const projectTypeSchema = z.enum([
  'research_prototype',
  'production',
  'open_source',
  'coursework',
  'competition',
  'other',
]);
