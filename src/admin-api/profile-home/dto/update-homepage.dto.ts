import { z } from 'zod';
import { homeSectionConfigArraySchema } from '../../../domain/profile-home/home-sections';
import {
  homeCollaborationCtaSchema,
  homeCurrentlyWorkingOnSchema,
  homeHighlightsArraySchema,
  scholarlyProfilesArraySchema,
} from '../../../domain/profile-home/profile-home-json.schemas';

const nullableText = z.string().nullable().optional();
const nullableShort = z.string().max(500).nullable().optional();

export const updateHomepageBodySchema = z
  .object({
    heroTitle: z.string().max(500).nullable().optional(),
    heroSubtitle: nullableText,
    heroDescriptor: nullableShort,
    heroPositioning: nullableText,
    statusBadge: z.string().max(80).nullable().optional(),
    primaryCtaLabel: z.string().max(120).nullable().optional(),
    primaryCtaHref: z.string().max(500).nullable().optional(),
    secondaryCtaLabel: z.string().max(120).nullable().optional(),
    secondaryCtaHref: z.string().max(500).nullable().optional(),
    heroMediaId: z.string().uuid().nullable().optional(),
    sections: homeSectionConfigArraySchema.optional(),
    highlights: homeHighlightsArraySchema.nullable().optional(),
    currentlyWorkingOn: homeCurrentlyWorkingOnSchema.nullable().optional(),
    collaborationCta: homeCollaborationCtaSchema.nullable().optional(),
    profiles: scholarlyProfilesArraySchema.nullable().optional(),
    seoTitle: z.string().max(120).nullable().optional(),
    seoDescription: z.string().max(320).nullable().optional(),
  })
  .strict();

export type UpdateHomepageBody = z.infer<typeof updateHomepageBodySchema>;
