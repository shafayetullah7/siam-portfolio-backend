import { z } from 'zod';

export const updateMediaMetadataBodySchema = z
  .object({
    alt: z.string().max(500).nullable().optional(),
    caption: z.string().nullable().optional(),
    license: z.string().nullable().optional(),
  })
  .refine(
    (body) =>
      body.alt !== undefined ||
      body.caption !== undefined ||
      body.license !== undefined,
    { message: 'At least one metadata field is required.' },
  );

export type UpdateMediaMetadataBody = z.infer<
  typeof updateMediaMetadataBodySchema
>;
