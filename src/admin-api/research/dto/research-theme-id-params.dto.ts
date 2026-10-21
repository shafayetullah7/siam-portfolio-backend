import { z } from 'zod';

export const researchThemeIdParamSchema = z.uuid();

export type ResearchThemeIdParam = z.infer<typeof researchThemeIdParamSchema>;
