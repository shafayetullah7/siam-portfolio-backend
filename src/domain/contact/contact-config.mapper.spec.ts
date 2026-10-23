import { describe, expect, it } from 'vitest';
import { toPublicContactConfig } from './contact-config.mapper';

const baseSettings = {
  id: 'site-1',
  siteName: 'SIAM',
  defaultMetaDescription: null,
  footerText: null,
  researchHubIntro: null,
  projectsHubIntro: null,
  writingHubIntro: null,
  achievementsHubIntro: null,
  experienceHubIntro: null,
  contactFormEnabled: true,
  contactPageIntro: null,
  contactCollaborationGuidance: null,
  contactResponseTimeNote: null,
  contactCategories: [] as string[],
  contactConsentText: null,
  contactSuccessMessage: null,
  contactPublicEmail: null,
  contactShowEmailOnPage: false,
  faviconUrl: null,
  faviconMediaId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('toPublicContactConfig', () => {
  it('returns empty categories when settings array is empty', () => {
    const config = toPublicContactConfig(baseSettings);
    expect(config.categories).toEqual([]);
    expect(config.intro).toBeNull();
  });

  it('propagates contactFormEnabled false', () => {
    const config = toPublicContactConfig({
      ...baseSettings,
      contactFormEnabled: false,
    });
    expect(config.formEnabled).toBe(false);
  });

  it('copies categories and text fields', () => {
    const config = toPublicContactConfig({
      ...baseSettings,
      contactPageIntro: 'Intro',
      contactCategories: ['Media', 'Other'],
      contactCollaborationGuidance: 'Include your topic.',
    });
    expect(config.intro).toBe('Intro');
    expect(config.categories).toEqual(['Media', 'Other']);
    expect(config.collaborationGuidance).toBe('Include your topic.');
  });
});
