import { z } from 'zod';

export const mediaAdminResponseSchema = z
  .object({
    id: z.uuid(),
    fileName: z.string(),
    url: z.string(),
    mimeType: z.string().nullable(),
    size: z.number().int(),
    alt: z.string().nullable(),
    caption: z.string().nullable(),
    license: z.string().nullable(),
    usesCount: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ title: 'MediaAdmin' });

export type MediaAdminResponse = z.infer<typeof mediaAdminResponseSchema>;
