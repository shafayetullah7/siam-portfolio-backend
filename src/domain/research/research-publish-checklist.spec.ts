import { describe, expect, it } from 'vitest';
import { researchPublishChecklist } from './research-publish-checklist';
import type { ResearchThemeRow } from './research.types';

function baseRow(overrides: Partial<ResearchThemeRow> = {}): ResearchThemeRow {
  return {
    id: 'id-1',
    slug: 'theme-a',
    title: 'Theme A',
    summary: 'Summary',
    themeStatus: 'ongoing',
    problem: 'Problem statement',
    significance: null,
    objectives: 'Objectives',
    approach: null,
    findings: null,
    limitations: null,
    futureWork: null,
    tags: null,
    linkLabel: null,
    coverMediaId: null,
    sortOrder: 0,
    featuredOnHome: false,
    publishStatus: 'draft',
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    seoTitle: null,
    seoDescription: null,
    collaborators: null,
    acknowledgments: null,
    funding: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('researchPublishChecklist', () => {
  it('returns error when title is empty', () => {
    const result = researchPublishChecklist(baseRow({ title: '' }));
    expect(result.errors.some((e) => e.code === 'title_required')).toBe(true);
  });

  it('warns when ongoing theme has findings text', () => {
    const result = researchPublishChecklist(
      baseRow({ findings: 'We already solved it.' }),
    );
    expect(result.warnings.some((e) => e.code === 'ongoing_has_findings')).toBe(
      true,
    );
  });

  it('warns when linked publications are unpublished', () => {
    const result = researchPublishChecklist(baseRow(), {
      unpublishedPublicationTitles: ['Draft Paper'],
    });
    expect(
      result.warnings.some((e) => e.code === 'related_unpublished_publications'),
    ).toBe(true);
  });

  it('warns when linked projects are unpublished', () => {
    const result = researchPublishChecklist(baseRow(), {
      unpublishedProjectTitles: ['Draft Project'],
    });
    expect(
      result.warnings.some((e) => e.code === 'related_unpublished_projects'),
    ).toBe(true);
  });
});
