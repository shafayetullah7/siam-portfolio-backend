import { describe, expect, it } from 'vitest';
import { HOME_SECTION_IDS } from '../../domain/profile-home/home-section-ids';
import { homePublishChecklist } from '../../domain/profile-home/home-publish-checklist';
import { profilePublishChecklist } from '../../domain/profile-home/profile-publish-checklist';
import {
  defaultHomeSections,
  homepageCompositionDefaults,
  profileIdentityDefaults,
} from './profile-home.catalog';

describe('profile-home.catalog', () => {
  it('defines all home sections visible in catalog order', () => {
    const sections = defaultHomeSections();
    expect(sections).toHaveLength(HOME_SECTION_IDS.length);
    expect(sections.map((s) => s.id)).toEqual([...HOME_SECTION_IDS]);
    expect(sections.every((s) => s.visible)).toBe(true);
  });

  it('keeps identity and hero copy within publish checklist expectations', () => {
    const { displayName, headline } = profileIdentityDefaults;
    expect(displayName.trim().length).toBeGreaterThan(0);
    expect(headline.trim().length).toBeGreaterThan(0);
    expect(profileIdentityDefaults.shortBio.length).toBeLessThanOrEqual(160);

    const profileResult = profilePublishChecklist({
      displayName,
      headline,
      portraitMediaId: null,
      portraitMediaAlt: null,
    });
    expect(profileResult.errors).toHaveLength(0);

    const homeResult = homePublishChecklist({
      heroTitle: homepageCompositionDefaults.heroTitle,
      heroDescriptor: homepageCompositionDefaults.heroDescriptor,
      displayName,
      headline,
      heroMediaId: null,
      heroMediaAlt: null,
    });
    expect(homeResult.errors).toHaveLength(0);
  });

  it('uses primary navigation CTAs aligned with public routes', () => {
    expect(homepageCompositionDefaults.primaryCtaHref).toBe('/research');
    expect(homepageCompositionDefaults.secondaryCtaHref).toBe('/contact');
    expect(homepageCompositionDefaults.collaborationCta.href).toBe('/contact');
  });
});
