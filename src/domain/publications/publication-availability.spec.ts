import { describe, expect, it } from 'vitest';
import { availabilityForPublication } from './publication-availability';
import { publicationRow } from './publications.service.spec';

describe('availabilityForPublication', () => {
  it('returns open_access when pdf href present', () => {
    const row = publicationRow({ openAccess: false, doi: null });
    expect(
      availabilityForPublication(row, { pdfHref: 'https://cdn.example/a.pdf' }),
    ).toBe('open_access');
  });

  it('returns open_access when openAccess flag set', () => {
    const row = publicationRow({ openAccess: true, doi: null });
    expect(availabilityForPublication(row)).toBe('open_access');
  });

  it('returns publisher_link when doi without pdf', () => {
    const row = publicationRow({
      openAccess: false,
      doi: '10.1/example',
      publisherUrl: null,
    });
    expect(availabilityForPublication(row)).toBe('publisher_link');
  });

  it('returns no_pdf when no links', () => {
    const row = publicationRow({
      openAccess: false,
      doi: null,
      publisherUrl: null,
    });
    expect(availabilityForPublication(row)).toBe('no_pdf');
  });
});
