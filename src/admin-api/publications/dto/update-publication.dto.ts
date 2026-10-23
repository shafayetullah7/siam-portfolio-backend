import { z } from 'zod';
import { createPublicationBodySchema } from './create-publication.dto';

export const updatePublicationBodySchema =
  createPublicationBodySchema.partial();

export type UpdatePublicationBody = z.infer<
  typeof updatePublicationBodySchema
>;
