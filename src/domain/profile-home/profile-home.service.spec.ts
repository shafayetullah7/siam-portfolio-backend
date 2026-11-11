import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { homepage, profile } from '../../db/schema/profile-home';
import { ProfileHomeService } from './profile-home.service';

const profileId = '00000000-0000-4000-8000-000000000001';
const homepageId = '00000000-0000-4000-8000-000000000002';

function baseProfileRow(overrides: Record<string, unknown> = {}) {
  return {
    id: profileId,
    headline: null,
    displayName: 'Ada Lovelace',
    professionalTitle: null,
    contactEmail: null,
    shortBio: null,
    longBio: null,
    affiliation: null,
    affiliationRole: 'Researcher',
    affiliationOrganization: 'Lab',
    affiliationLocation: null,
    portraitMediaId: null,
    scholarlyProfiles: null,
    researchStatement: null,
    expertise: null,
    collaborationInterests: null,
    publishStatus: 'published',
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function baseHomepageRow(overrides: Record<string, unknown> = {}) {
  return {
    id: homepageId,
    heroTitle: 'Legacy title',
    heroSubtitle: 'Legacy subtitle',
    heroDescriptor: 'ML researcher',
    heroPositioning: 'Positioning copy',
    statusBadge: null,
    primaryCtaLabel: null,
    primaryCtaHref: null,
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    heroMediaId: null,
    sections: [
      { id: 'hero', visible: true },
      { id: 'researchFocus', visible: false },
      { id: 'featuredProjects', visible: true },
    ],
    highlights: null,
    currentlyWorkingOn: null,
    collaborationCta: null,
    profiles: null,
    seoTitle: null,
    seoDescription: null,
    publishStatus: 'published',
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createDbMock(opts: {
  profile?: ReturnType<typeof baseProfileRow>;
  homepage?: ReturnType<typeof baseHomepageRow>;
}) {
  const profileRow = opts.profile ?? baseProfileRow();
  const homepageRow = opts.homepage ?? baseHomepageRow();

  const limitFor = (table: unknown) => ({
    limit: vi.fn().mockResolvedValue([
      table === profile ? profileRow : homepageRow,
    ]),
  });

  const updateReturning = vi.fn().mockResolvedValue([homepageRow]);
  const updateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: updateReturning,
  };

  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn((table: unknown) => limitFor(table)),
      })),
      insert: vi.fn(),
      update: vi.fn(() => updateChain),
    },
    profileRow,
    homepageRow,
    updateReturning,
  };
}

function serviceWithDb(db: unknown, mediaOverrides: Record<string, unknown> = {}): ProfileHomeService {
  const media = {
    findById: vi.fn().mockResolvedValue({
      url: 'https://cdn.example/portrait.jpg',
      alt: 'Portrait alt',
      ...mediaOverrides,
    }),
  };
  return new ProfileHomeService(db as never, media as never);
}

describe('ProfileHomeService.getPublicHome', () => {
  it('returns legacy hero fields regardless of publish status', async () => {
    const { db } = createDbMock({
      homepage: baseHomepageRow({ publishStatus: 'draft' }),
    });
    const service = serviceWithDb(db);
    await expect(service.getPublicHome()).resolves.toEqual({
      heroTitle: 'Legacy title',
      heroSubtitle: 'Legacy subtitle',
    });
  });
});

describe('ProfileHomeService.getPublicHomeShellPublished', () => {
  it('returns empty shell when homepage is draft', async () => {
    const { db } = createDbMock({
      homepage: baseHomepageRow({ publishStatus: 'draft' }),
    });
    const service = serviceWithDb(db);
    const shell = await service.getPublicHomeShellPublished();
    expect(shell.heroTitle).toBeNull();
    expect(shell.visibleSectionIds).toEqual(['hero']);
  });

  it('omits sections marked visible false', async () => {
    const { db } = createDbMock({
      homepage: baseHomepageRow({
        publishStatus: 'published',
        sections: [
          { id: 'hero', visible: true },
          { id: 'researchFocus', visible: false },
          { id: 'featuredProjects', visible: true },
        ],
      }),
    });
    const service = serviceWithDb(db);
    const shell = await service.getPublicHomeShellPublished();
    expect(shell.visibleSectionIds).toEqual(['hero', 'featuredProjects']);
    expect(shell.heroDescriptor).toBe('ML researcher');
    expect(shell.displayName).toBe('Ada Lovelace');
  });

  it('enriches portrait from profile when homepage is published', async () => {
    const portraitId = '00000000-0000-4000-8000-000000000099';
    const { db } = createDbMock({
      profile: baseProfileRow({ portraitMediaId: portraitId }),
      homepage: baseHomepageRow({ publishStatus: 'published' }),
    });
    const service = serviceWithDb(db);
    const shell = await service.getPublicHomeShellPublished();
    expect(shell.heroPortraitUrl).toBe('https://cdn.example/portrait.jpg');
    expect(shell.heroPortraitAlt).toBe('Portrait alt');
  });
});

describe('ProfileHomeService.getPublicAboutPublished', () => {
  it('returns null fields when profile is draft', async () => {
    const { db } = createDbMock({
      profile: baseProfileRow({ publishStatus: 'draft', shortBio: 'Bio' }),
    });
    const service = serviceWithDb(db);
    await expect(service.getPublicAboutPublished()).resolves.toEqual({
      headline: null,
      shortBio: null,
      longBio: null,
      affiliation: null,
    });
  });
});

describe('ProfileHomeService.getPublicAboutForSite', () => {
  it('returns extended fields when profile is published', async () => {
    const { db } = createDbMock({
      profile: baseProfileRow({
        publishStatus: 'published',
        displayName: 'Ada',
        researchStatement: 'Why ML',
        expertise: {
          domains: ['Trustworthy ML'],
          methodologies: [],
          tooling: [],
          practices: [],
        },
        collaborationInterests: 'Open to student co-advising.',
      }),
    });
    const service = serviceWithDb(db);
    const about = await service.getPublicAboutForSite();
    expect(about.published).toBe(true);
    expect(about.displayName).toBe('Ada');
    expect(about.researchStatement).toBe('Why ML');
    expect(about.expertise?.domains).toEqual(['Trustworthy ML']);
    expect(about.collaborationInterests).toBe(
      'Open to student co-advising.',
    );
  });

  it('returns empty published flag when profile is draft', async () => {
    const { db } = createDbMock({
      profile: baseProfileRow({ publishStatus: 'draft', shortBio: 'Bio' }),
    });
    const service = serviceWithDb(db);
    const about = await service.getPublicAboutForSite();
    expect(about.published).toBe(false);
    expect(about.shortBio).toBeNull();
  });
});

describe('ProfileHomeService.isHomepagePublished', () => {
  it('reflects homepage publish status', async () => {
    const { db } = createDbMock({
      homepage: baseHomepageRow({ publishStatus: 'published' }),
    });
    const service = serviceWithDb(db);
    await expect(service.isHomepagePublished()).resolves.toBe(true);
  });
});

describe('ProfileHomeService.updateHomepage', () => {
  it('rejects invalid section ids', async () => {
    const { db } = createDbMock({});
    const service = serviceWithDb(db);
    await expect(
      service.updateHomepage({
        sections: [{ id: 'not-a-section', visible: true }] as never,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('ProfileHomeService.publishHomepage', () => {
  it('publishes when checklist passes', async () => {
    const { db, homepageRow, updateReturning } = createDbMock({});
    const service = serviceWithDb(db);
    vi.spyOn(service, 'getHomepagePublishChecklist').mockResolvedValue({
      errors: [],
      warnings: [],
    });
    updateReturning.mockResolvedValueOnce([
      { ...homepageRow, publishStatus: 'published' },
    ]);
    const row = await service.publishHomepage();
    expect(row.publishStatus).toBe('published');
  });
});
