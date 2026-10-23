import { z } from 'zod';

export const updateSiteSettingsBodySchema = z.object({
  siteName: z.string().min(1).max(200).optional(),
  defaultMetaDescription: z.string().max(320).nullable().optional(),
  footerText: z.string().nullable().optional(),
  researchHubIntro: z.string().max(10_000).nullable().optional(),
  projectsHubIntro: z.string().max(10_000).nullable().optional(),
  faviconUrl: z.string().max(500).nullable().optional(),
  faviconMediaId: z.string().uuid().nullable().optional(),
});

export type UpdateSiteSettingsBody = z.infer<typeof updateSiteSettingsBodySchema>;
