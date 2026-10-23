import { z } from 'zod';

export const publicationAuthorInputSchema = z.object({
  name: z.string().min(1).max(200),
  affiliation: z.string().max(500).optional().nullable(),
  orcid: z.string().max(50).optional().nullable(),
});

export const publicationAuthorsBodySchema = z
  .array(publicationAuthorInputSchema)
  .min(1)
  .max(50);

export const publicationAuthorAdminSchema = publicationAuthorInputSchema.extend({
  sortOrder: z.number().int().min(0),
});

export const publicationAuthorPublicSchema = z.object({
  name: z.string(),
  affiliation: z.string().optional(),
  orcid: z.string().optional(),
});

export type PublicationAuthorInputDto = z.infer<
  typeof publicationAuthorInputSchema
>;
