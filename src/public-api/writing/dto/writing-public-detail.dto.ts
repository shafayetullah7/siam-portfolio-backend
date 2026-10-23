import { z } from 'zod';
import { writingPublicCardSchema } from './writing-public-card.dto';
import { writingPublicRelatedSchema } from './writing-public-related.dto';

const writingSeriesLabelSchema = z.object({
  slug: z.string(),
  title: z.string(),
});

export const writingPublicDetailSchema = writingPublicCardSchema
  .extend({
    subtitle: z.string().nullable().optional(),
    body: z.string(),
    wordCount: z.number().int().nullable().optional(),
    byline: z.string().nullable().optional(),
    related: writingPublicRelatedSchema,
    seoTitle: z.string().nullable().optional(),
    seoDescription: z.string().nullable().optional(),
    prevSlug: z.string().optional(),
    nextSlug: z.string().optional(),
    seriesPrevSlug: z.string().optional(),
    seriesNextSlug: z.string().optional(),
    series: writingSeriesLabelSchema.optional(),
  })
  .meta({ title: 'WritingPublicDetail' });

export type WritingPublicDetailDto = z.infer<typeof writingPublicDetailSchema>;
