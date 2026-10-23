import { z } from 'zod';
import { normalizeContactCategories } from '../../../domain/site/normalize-contact-categories';

const nullableTrimmedText = z
  .string()
  .max(10_000)
  .nullable()
  .optional();

const contactCategoriesSchema = z
  .array(z.string().trim().min(1).max(100))
  .max(20)
  .optional()
  .transform((arr) => (arr === undefined ? undefined : normalizeContactCategories(arr)));

const contactPublicEmailSchema = z
  .union([z.string().email().max(320), z.literal(''), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    if (v === '' || v === null) return null;
    return v;
  });

export const updateSiteSettingsBodySchema = z.object({
  siteName: z.string().min(1).max(200).optional(),
  defaultMetaDescription: z.string().max(320).nullable().optional(),
  footerText: z.string().nullable().optional(),
  researchHubIntro: nullableTrimmedText,
  projectsHubIntro: nullableTrimmedText,
  writingHubIntro: nullableTrimmedText,
  achievementsHubIntro: nullableTrimmedText,
  experienceHubIntro: nullableTrimmedText,
  contactFormEnabled: z.boolean().optional(),
  contactPageIntro: nullableTrimmedText,
  contactCollaborationGuidance: nullableTrimmedText,
  contactResponseTimeNote: nullableTrimmedText,
  contactCategories: contactCategoriesSchema,
  contactConsentText: nullableTrimmedText,
  contactSuccessMessage: nullableTrimmedText,
  contactPublicEmail: contactPublicEmailSchema,
  contactShowEmailOnPage: z.boolean().optional(),
  faviconUrl: z.string().max(500).nullable().optional(),
  faviconMediaId: z.string().uuid().nullable().optional(),
});

export type UpdateSiteSettingsBody = z.infer<typeof updateSiteSettingsBodySchema>;
