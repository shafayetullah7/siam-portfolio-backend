import { z } from 'zod';
import {
  profileExpertiseSchema,
  scholarlyProfilesArraySchema,
} from '../../../domain/profile-home/profile-home-json.schemas';

const nullableText = z.string().nullable().optional();

export const updateProfileBodySchema = z
  .object({
    headline: z.string().max(300).nullable().optional(),
    displayName: z.string().max(200).nullable().optional(),
    professionalTitle: z.string().max(300).nullable().optional(),
    contactEmail: z.union([z.string().email().max(320), z.literal(''), z.null()]).optional(),
    shortBio: nullableText,
    longBio: nullableText,
    affiliation: z.string().max(300).nullable().optional(),
    affiliationRole: z.string().max(300).nullable().optional(),
    affiliationOrganization: z.string().max(300).nullable().optional(),
    affiliationLocation: z.string().max(300).nullable().optional(),
    portraitMediaId: z.string().uuid().nullable().optional(),
    scholarlyProfiles: scholarlyProfilesArraySchema.nullable().optional(),
    researchStatement: nullableText,
    expertise: profileExpertiseSchema.nullable().optional(),
    collaborationInterests: nullableText,
  })
  .strict();

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
