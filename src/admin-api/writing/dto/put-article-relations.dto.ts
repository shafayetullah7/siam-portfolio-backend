import { z } from 'zod';

const uuidArray = z.array(z.string().uuid()).max(20);

export const putArticleRelationsBodySchema = z.object({
  publicationIds: uuidArray.optional(),
  projectIds: uuidArray.optional(),
  themeIds: uuidArray.optional(),
  relatedArticleIds: uuidArray.optional(),
});

export type PutArticleRelationsBody = z.infer<
  typeof putArticleRelationsBodySchema
>;

export const articleRelationsResponseSchema = z.object({
  publicationIds: z.array(z.string().uuid()),
  projectIds: z.array(z.string().uuid()),
  themeIds: z.array(z.string().uuid()),
  relatedArticleIds: z.array(z.string().uuid()),
});

export type ArticleRelationsResponse = z.infer<
  typeof articleRelationsResponseSchema
>;
