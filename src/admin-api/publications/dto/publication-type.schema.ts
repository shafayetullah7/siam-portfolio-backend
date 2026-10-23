import { z } from 'zod';

export const PUBLICATION_TYPES = [
  'journal',
  'conference',
  'preprint',
  'workshop',
  'thesis',
  'other',
] as const;

export const publicationTypeSchema = z.enum(PUBLICATION_TYPES);

export type PublicationTypeDto = z.infer<typeof publicationTypeSchema>;
