import { describe, expect, it } from 'vitest';
import { homePublishChecklist } from './home-publish-checklist';

describe('homePublishChecklist', () => {
  const base = {
    heroTitle: null,
    heroDescriptor: 'ML researcher',
    displayName: 'Ada',
    headline: null,
    heroMediaId: null,
    heroMediaAlt: null,
  };

  it('passes when hero name and descriptor set', () => {
    const result = homePublishChecklist(base);
    expect(result.errors).toHaveLength(0);
  });

  it('errors when hero name and descriptor missing', () => {
    const result = homePublishChecklist({
      ...base,
      displayName: null,
      heroDescriptor: '  ',
    });
    expect(result.errors.map((e) => e.code)).toContain('HERO_NAME_REQUIRED');
    expect(result.errors.map((e) => e.code)).toContain('HERO_DESCRIPTOR_REQUIRED');
  });

  it('errors on hero media without alt', () => {
    const result = homePublishChecklist({
      ...base,
      heroMediaId: '00000000-0000-4000-8000-000000000099',
      heroMediaAlt: '',
    });
    expect(result.errors.map((e) => e.code)).toContain('HERO_MEDIA_ALT_REQUIRED');
  });

  it('warns on unpublished featured items', () => {
    const result = homePublishChecklist({
      ...base,
      unpublishedFeaturedPublicationTitles: ['Draft paper'],
    });
    expect(result.warnings.map((w) => w.code)).toContain('FEATURED_NOT_PUBLISHED');
  });
});
