import { z } from 'zod';
import { publicationTypeSchema } from '../../../admin-api/publications/dto/publication-type.schema';
import { publicationAvailabilitySchema } from './publication-availability.schema';

export const publicationPublicCardSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    authorsShort: z.string(),
    year: z.number().int(),
    venue: z.string(),
    publicationType: publicationTypeSchema,
    featured: z.boolean(),
    significance: z.string().optional(),
    doi: z.string().optional(),
    href: z.string(),
    availability: publicationAvailabilitySchema,
  })
  .meta({ title: 'PublicationPublicCard' });

export type PublicationPublicCardDto = z.infer<
  typeof publicationPublicCardSchema
>;
