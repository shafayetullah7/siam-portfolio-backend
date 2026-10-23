import { z } from 'zod';

export const importPreviewBodySchema = z
  .object({
    source: z.enum(['bibtex', 'doi']),
    bibtex: z.string().max(500_000).optional(),
    doi: z.string().max(200).optional(),
  })
  .superRefine((body, ctx) => {
    if (body.source === 'bibtex' && !body.bibtex?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'bibtex is required when source is bibtex',
        path: ['bibtex'],
      });
    }
    if (body.source === 'doi' && !body.doi?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'doi is required when source is doi',
        path: ['doi'],
      });
    }
    if (body.source === 'bibtex' && body.doi?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide only bibtex or doi, not both',
        path: ['doi'],
      });
    }
    if (body.source === 'doi' && body.bibtex?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide only bibtex or doi, not both',
        path: ['bibtex'],
      });
    }
  });

export type ImportPreviewBody = z.infer<typeof importPreviewBodySchema>;
