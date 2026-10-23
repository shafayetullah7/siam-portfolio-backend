import { describe, expect, it } from 'vitest';
import { mapCrossrefToProposed, normalizeDoi } from './publication-doi-import';

describe('publication-doi-import', () => {
  it('normalizeDoi strips doi.org prefix', () => {
    expect(normalizeDoi('https://doi.org/10.1/ABC')).toBe('10.1/abc');
  });

  it('mapCrossrefToProposed maps authors and year', () => {
    const proposed = mapCrossrefToProposed(
      {
        title: ['Example Paper'],
        author: [{ given: 'Ada', family: 'Lovelace' }],
        issued: { 'date-parts': [[2024, 3]] },
        'container-title': ['Journal of Examples'],
        DOI: '10.1/example',
        type: 'journal-article',
      },
      '10.1/example',
    );
    expect(proposed.title).toBe('Example Paper');
    expect(proposed.year).toBe(2024);
    expect(proposed.authors[0].name).toBe('Ada Lovelace');
    expect(proposed.publicationType).toBe('journal');
  });
});
