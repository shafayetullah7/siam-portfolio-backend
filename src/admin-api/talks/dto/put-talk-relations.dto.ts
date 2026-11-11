import { z } from 'zod';

const idList = z.array(z.string().uuid()).max(20).optional();

export const putTalkRelationsBodySchema = z.object({
  publicationIds: idList,
  projectIds: idList,
  themeIds: idList,
});

export type PutTalkRelationsBody = z.infer<typeof putTalkRelationsBodySchema>;
