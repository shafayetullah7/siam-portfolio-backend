import { z } from 'zod';
import { projectPublicCardSchema } from '../../projects/dto/project-public-card.dto';
import { publicationPublicCardSchema } from '../../publications/dto/publication-public-card.dto';
import { writingPublicCardSchema } from './writing-public-card.dto';

const themeRelatedCardSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  href: z.string(),
});

export const writingPublicRelatedSchema = z.object({
  articles: z.array(writingPublicCardSchema),
  publications: z.array(publicationPublicCardSchema),
  projects: z.array(projectPublicCardSchema),
  themes: z.array(themeRelatedCardSchema),
});

export type WritingPublicRelatedDto = z.infer<
  typeof writingPublicRelatedSchema
>;
