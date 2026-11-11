import { z } from 'zod';

const optionalText = z.string().max(10_000).optional().nullable();

export const createCollaborationBodySchema = z.object({
  partnerName: z.string().min(1).max(500),
  summary: z.string().min(1).max(50_000),
  institution: z.string().max(500).optional().nullable(),
  logoMediaId: z.string().uuid().nullable().optional(),
  role: z.string().max(500).optional().nullable(),
  period: z.string().max(200).optional().nullable(),
  outcomes: optionalText,
  sortOrder: z.coerce.number().int().min(0).max(10_000).optional(),
});

export type CreateCollaborationBody = z.infer<typeof createCollaborationBodySchema>;
