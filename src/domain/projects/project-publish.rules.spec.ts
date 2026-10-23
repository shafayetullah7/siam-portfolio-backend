import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertPublishable } from './project-publish.rules';
import type { ProjectRow } from './projects.types';

function baseRow(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: 'id-1',
    slug: 'my-project',
    title: 'Title',
    summary: 'Summary',
    tags: null,
    projectType: 'other',
    projectStatus: 'completed',
    evaluationMaturity: 'provisional',
    ownerRole: null,
    ownerContribution: null,
    resultTeaser: null,
    periodStart: null,
    periodEnd: null,
    coverMediaId: null,
    featured: false,
    featuredOnHome: false,
    sortOrder: 0,
    seoTitle: null,
    seoDescription: null,
    hideFromSearch: false,
    publishStatus: 'draft',
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const minimalSections = [
  {
    id: 's1',
    projectId: 'id-1',
    sortOrder: 0,
    kind: 'problem' as const,
    title: null,
    body: 'Problem',
  },
  {
    id: 's2',
    projectId: 'id-1',
    sortOrder: 1,
    kind: 'limitations' as const,
    title: null,
    body: 'Limits',
  },
];

describe('assertPublishable', () => {
  it('accepts a valid row with required sections', () => {
    expect(() =>
      assertPublishable(baseRow({ ownerRole: 'Lead' }), minimalSections),
    ).not.toThrow();
  });

  it('rejects empty title', () => {
    expect(() => assertPublishable(baseRow({ title: '  ' }))).toThrow(
      BadRequestException,
    );
  });

  it('rejects invalid slug', () => {
    expect(() => assertPublishable(baseRow({ slug: 'Bad Slug' }))).toThrow(
      BadRequestException,
    );
  });
});
