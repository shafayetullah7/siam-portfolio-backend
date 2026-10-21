import { z } from 'zod';
import { createResearchThemeBodySchema } from './create-research-theme.dto';

export const updateResearchThemeBodySchema =
  createResearchThemeBodySchema.partial();

export type UpdateResearchThemeBody = z.infer<
  typeof updateResearchThemeBodySchema
>;
