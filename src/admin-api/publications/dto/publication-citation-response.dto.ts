import { z } from 'zod';

export const publicationCitationResponseSchema = z
  .object({
    citeKey: z.string(),
    bibtex: z.string(),
    formatted: z.string(),
  })
  .meta({ title: 'PublicationCitation' });

export type PublicationCitationResponse = z.infer<
  typeof publicationCitationResponseSchema
>;
