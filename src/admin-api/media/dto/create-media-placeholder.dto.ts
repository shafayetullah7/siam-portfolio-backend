import { z } from 'zod';

export const createMediaPlaceholderBodySchema = z.object({
  url: z.string().url().max(1000),
  publicKey: z.string().min(1).max(300),
  fileName: z.string().min(1).max(500).optional(),
  mimeType: z.string().max(100).optional(),
  size: z.number().int().nonnegative().optional(),
  alt: z.string().max(500).optional(),
  adminId: z.string().uuid().optional(),
});

export type CreateMediaPlaceholderBody = z.infer<
  typeof createMediaPlaceholderBodySchema
>;
