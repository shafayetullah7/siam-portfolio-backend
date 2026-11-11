import { z } from 'zod';
import { createAcademicServiceBodySchema } from './create-academic-service.dto';

export const updateAcademicServiceBodySchema =
  createAcademicServiceBodySchema.partial();

export type UpdateAcademicServiceBody = z.infer<
  typeof updateAcademicServiceBodySchema
>;
