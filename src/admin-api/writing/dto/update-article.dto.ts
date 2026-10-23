import { z } from 'zod';
import { createArticleBodySchema } from './create-article.dto';

export const updateArticleBodySchema = createArticleBodySchema.partial();

export type UpdateArticleBody = z.infer<typeof updateArticleBodySchema>;
