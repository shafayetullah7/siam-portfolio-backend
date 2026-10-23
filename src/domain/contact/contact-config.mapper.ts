import type { siteSettings } from '../../db/schema/site';

export type PublicContactConfig = {
  formEnabled: boolean;
  intro: string | null;
  collaborationGuidance: string | null;
  responseTimeNote: string | null;
  categories: string[];
  consentText: string | null;
  successMessage: string | null;
  publicEmail: string | null;
  showEmailOnPage: boolean;
};

type SiteSettingsRow = typeof siteSettings.$inferSelect;

export function toPublicContactConfig(
  settings: SiteSettingsRow,
): PublicContactConfig {
  const categories = settings.contactCategories;
  return {
    formEnabled: settings.contactFormEnabled,
    intro: settings.contactPageIntro,
    collaborationGuidance: settings.contactCollaborationGuidance,
    responseTimeNote: settings.contactResponseTimeNote,
    categories: Array.isArray(categories) ? [...categories] : [],
    consentText: settings.contactConsentText,
    successMessage: settings.contactSuccessMessage,
    publicEmail: settings.contactPublicEmail,
    showEmailOnPage: settings.contactShowEmailOnPage,
  };
}
