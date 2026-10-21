import { describe, expect, it } from 'vitest';
import {
  isEmptyResearchThemeRevisionDelta,
  researchThemeRevisionDelta,
} from './research-revision.snapshot';

describe('researchThemeRevisionDelta', () => {
  it('returns only changed fields with new values', () => {
    const delta = researchThemeRevisionDelta(
      { title: 'Old', publishStatus: 'draft', slug: 'x', summary: 's', problem: 'p' },
      { title: 'New', publishStatus: 'draft', slug: 'x', summary: 's', problem: 'p' },
    );
    expect(delta).toEqual({ title: 'New' });
  });

  it('returns all set fields when there is no before snapshot', () => {
    const delta = researchThemeRevisionDelta(undefined, {
      title: 'First',
      slug: 'first',
      summary: 'S',
      themeStatus: 'ongoing',
      problem: 'P',
      significance: null,
      objectives: null,
      approach: null,
      findings: null,
      limitations: null,
      futureWork: null,
      tags: null,
      linkLabel: null,
      coverMediaId: null,
      sortOrder: 0,
      featuredOnHome: false,
      seoTitle: null,
      seoDescription: null,
      collaborators: null,
      acknowledgments: null,
      funding: null,
      resources: [],
      publicationIds: [],
      projectIds: [],
      publishStatus: 'draft',
      publishedAt: null,
      scheduledAt: null,
      archivedAt: null,
    });
    expect(delta.title).toBe('First');
    expect(isEmptyResearchThemeRevisionDelta(delta)).toBe(false);
  });

  it('is empty when nothing changed', () => {
    const snap = { title: 'Same', publishStatus: 'draft' as const };
    expect(
      isEmptyResearchThemeRevisionDelta(
        researchThemeRevisionDelta(
          { ...snap, slug: 'a', summary: 's', problem: 'p' },
          { ...snap, slug: 'a', summary: 's', problem: 'p' },
        ),
      ),
    ).toBe(true);
  });
});
