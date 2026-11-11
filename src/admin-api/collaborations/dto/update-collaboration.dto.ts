import { z } from 'zod';
import { createCollaborationBodySchema } from './create-collaboration.dto';

export const updateCollaborationBodySchema =
  createCollaborationBodySchema.partial();

export type UpdateCollaborationBody = z.infer<typeof updateCollaborationBodySchema>;
