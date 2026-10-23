import { describe, expect, it } from 'vitest';
import {
  publicationPublishChecklist,
  venueLooksLikePreprint,
} from './publication-publish-checklist';
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
    abstract: 'An abstract.',
    publicationType: 'conference',
    peerReviewed: true,
    doi: '10.1234/example',
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

describe('venueLooksLikePreprint', () => {
  it('detects arXiv in venue', () => {
    expect(venueLooksLikePreprint('arXiv:2401.00001')).toBe(true);
  });
});

describe('publicationPublishChecklist', () => {
  it('returns error when title is empty', () => {
    const result = publicationPublishChecklist(baseRow({ title: '' }));
    expect(result.errors.some((e) => e.code === 'title_required')).toBe(true);
  });

  it('warns when DOI is missing', () => {
    const result = publicationPublishChecklist(baseRow({ doi: null }));
    expect(result.warnings.some((w) => w.code === 'doi_missing')).toBe(true);
  });

  it('warns when journal type has preprint-like venue', () => {
    const result = publicationPublishChecklist(
      baseRow({
        publicationType: 'journal',
        venue: 'arXiv preprint',
      }),
    );
    expect(
      result.warnings.some((w) => w.code === 'type_venue_mismatch'),
    ).toBe(true);
  });
});
