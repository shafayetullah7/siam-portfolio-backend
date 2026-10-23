import { z } from 'zod';

export const publicationAvailabilitySchema = z.enum([
  'open_access',
  'publisher_link',
  'no_pdf',
]);
