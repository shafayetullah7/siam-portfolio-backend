import { describe, expect, it } from 'vitest';
import type { HomePublicShell } from '../../domain/profile-home/profile-home.types';
import { assemblePublicHome } from './public-home.assembler';

const publishedShell: HomePublicShell = {
  heroTitle: 'Legacy',
  heroSubtitle: null,
  heroDescriptor: 'ML researcher',
  heroPositioning: 'Building trustworthy systems.',
  statusBadge: null,
  primaryCta: { label: 'Research', href: '/research' },
  secondaryCta: null,
  displayName: 'Ada',
  affiliationRole: 'Postdoc',
  affiliationOrganization: 'Lab',
  affiliationLocation: 'UK',
  visibleSectionIds: [
    'hero',
    'affiliation',
    'researchFocus',
    'selectedPublications',
    'featuredProjects',
  ],
  highlights: null,
  currentlyWorkingOn: null,
  collaborationCta: null,
  profiles: null,
  seoTitle: 'Home',
  seoDescription: 'Welcome',
  heroPortraitUrl: null,
  heroPortraitAlt: null,
};

describe('assemblePublicHome', () => {
  it('returns empty featured when homepage is not published', () => {
    const result = assemblePublicHome({
      shell: publishedShell,
      homepagePublished: false,
      researchFocus: [{ title: 'T', description: 'D', href: '/research/x' }],
      selectedPublications: [],
      selectedProjects: [],
    });
    expect(result.published).toBe(false);
    expect(result.researchFocus).toEqual([]);
    expect(result.hero).toBeUndefined();
    expect(result.heroTitle).toBeNull();
  });

  it('omits researchFocus when section hidden', () => {
    const shell: HomePublicShell = {
      ...publishedShell,
      visibleSectionIds: ['hero', 'affiliation'],
    };
    const result = assemblePublicHome({
      shell,
      homepagePublished: true,
      researchFocus: [{ title: 'T', description: 'D', href: '/research/x' }],
      selectedPublications: [],
      selectedProjects: [],
    });
    expect(result.published).toBe(true);
    expect(result.researchFocus).toEqual([]);
    expect(result.hero?.name).toBe('Ada');
    expect(result.affiliation?.organization).toBe('Lab');
  });

  it('includes featured arrays when sections visible', () => {
    const result = assemblePublicHome({
      shell: publishedShell,
      homepagePublished: true,
      researchFocus: [{ title: 'T', description: 'D', href: '/research/x' }],
      selectedPublications: [
        {
          title: 'Paper',
          authorsShort: 'Ada',
          year: 2024,
          venue: 'Conf',
          significance: 'Sig',
          href: '/publications/p',
        },
      ],
      selectedProjects: [
        {
          title: 'Proj',
          summary: 'S',
          href: '/projects/p',
        },
      ],
    });
    expect(result.researchFocus).toHaveLength(1);
    expect(result.selectedPublications).toHaveLength(1);
    expect(result.selectedProjects).toHaveLength(1);
    expect(result.seo?.title).toBe('Home');
  });

  it('includes hero portrait when shell has url and alt', () => {
    const shell: HomePublicShell = {
      ...publishedShell,
      heroPortraitUrl: 'https://cdn/portrait.jpg',
      heroPortraitAlt: 'Researcher at desk',
    };
    const result = assemblePublicHome({
      shell,
      homepagePublished: true,
      researchFocus: [],
      selectedPublications: [],
      selectedProjects: [],
    });
    expect(result.hero?.portrait).toEqual({
      url: 'https://cdn/portrait.jpg',
      alt: 'Researcher at desk',
    });
  });

  it('omits portrait when alt is empty', () => {
    const shell: HomePublicShell = {
      ...publishedShell,
      heroPortraitUrl: 'https://cdn/portrait.jpg',
      heroPortraitAlt: '   ',
    };
    const result = assemblePublicHome({
      shell,
      homepagePublished: true,
      researchFocus: [],
      selectedPublications: [],
      selectedProjects: [],
    });
    expect(result.hero?.portrait).toBeUndefined();
  });
});
