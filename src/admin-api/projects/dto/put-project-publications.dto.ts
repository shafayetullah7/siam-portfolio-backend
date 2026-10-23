import { z } from 'zod';

export const putProjectPublicationsBodySchema = z.object({
  publicationIds: z.array(z.string().uuid()).max(20),
});

export type PutProjectPublicationsBody = z.infer<
  typeof putProjectPublicationsBodySchema
>;

export const projectPublicationLinkSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  authorsShort: z.string(),
  year: z.number().int(),
  venue: z.string(),
  publishStatus: z.string(),
  sortOrder: z.number().int(),
});

export type ProjectPublicationLink = z.infer<
  typeof projectPublicationLinkSchema
>;
