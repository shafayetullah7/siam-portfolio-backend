import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertPublishable } from './publication-publish.rules';
import type { PublicationRow } from './publications.types';

function baseRow(overrides: Partial<PublicationRow> = {}): PublicationRow {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'paper-one',
    title: 'Paper One',
    authorsShort: 'Author A',
    year: 2024,
    venue: 'NeurIPS',
    significance: null,
    abstract: null,
    publicationType: 'conference',
    peerReviewed: true,
    doi: null,
    publisherUrl: null,
    featured: false,
    featuredOnHome: false,
    seoTitle: null,
    seoDescription: null,
    ownerContribution: null,
    correctionNotice: null,
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

describe('assertPublishable', () => {
  it('accepts a valid row', () => {
    expect(() => assertPublishable(baseRow())).not.toThrow();
  });

  it('rejects empty title', () => {
    expect(() => assertPublishable(baseRow({ title: '  ' }))).toThrow(
      BadRequestException,
    );
  });

  it('rejects invalid year', () => {
    expect(() => assertPublishable(baseRow({ year: 1800 }))).toThrow(
      BadRequestException,
    );
  });
});
