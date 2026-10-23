import { z } from 'zod';
import { writingPublicCardSchema } from './writing-public-card.dto';

const writingPublicRelatedSchema = z.object({
  articles: z.array(z.never()),
  publications: z.array(z.never()),
  projects: z.array(z.never()),
  themes: z.array(z.never()),
});

export const writingPublicDetailSchema = writingPublicCardSchema
  .extend({
    subtitle: z.string().nullable().optional(),
    body: z.string(),
    byline: z.string().nullable().optional(),
    related: writingPublicRelatedSchema,
    seoTitle: z.string().nullable().optional(),
    seoDescription: z.string().nullable().optional(),
    prevSlug: z.string().optional(),
    nextSlug: z.string().optional(),
  })
  .meta({ title: 'WritingPublicDetail' });

export type WritingPublicDetailDto = z.infer<typeof writingPublicDetailSchema>;
