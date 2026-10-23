import { z } from 'zod';
import { createProjectBodySchema } from './create-project.dto';

export const updateProjectBodySchema = createProjectBodySchema.partial();

export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;
