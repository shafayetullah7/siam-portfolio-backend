import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertPublishable } from './research-publish.rules';
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

describe('assertPublishable', () => {
  it('accepts a minimal ongoing theme', () => {
    expect(() => assertPublishable(baseRow())).not.toThrow();
  });

  it('requires objectives for ongoing themes', () => {
    expect(() =>
      assertPublishable(baseRow({ objectives: '' })),
    ).toThrow(BadRequestException);
  });

  it('allows completed theme without objectives', () => {
    expect(() =>
      assertPublishable(
        baseRow({ themeStatus: 'completed', objectives: null }),
      ),
    ).not.toThrow();
  });

  it('requires problem at publish', () => {
    expect(() => assertPublishable(baseRow({ problem: '  ' }))).toThrow(
      BadRequestException,
    );
  });
});
