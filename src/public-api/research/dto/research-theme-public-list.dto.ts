import { z } from 'zod';
import { researchThemePublicCardSchema } from './research-theme-public-card.dto';

export const researchThemePublicListSchema = z
  .object({
    intro: z.string().nullable(),
    items: z.array(researchThemePublicCardSchema),
  })
  .meta({ title: 'ResearchThemePublicList' });

export type ResearchThemePublicList = z.infer<
  typeof researchThemePublicListSchema
>;
