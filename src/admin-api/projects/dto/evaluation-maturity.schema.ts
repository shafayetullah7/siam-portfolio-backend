import { z } from 'zod';

export const evaluationMaturitySchema = z.enum([
  'verified',
  'provisional',
  'experimental',
]);
