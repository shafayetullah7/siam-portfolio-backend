import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePublicationFromBibTeX } from './publication-bibtex-import';

const sampleBib = readFileSync(
  join(__dirname, '../../../../docs/content-packet/publications.bib'),
  'utf8',
);

describe('parsePublicationFromBibTeX', () => {
  it('parses sample publications.bib entry with author order', () => {
    const { proposed, parseWarnings } = parsePublicationFromBibTeX(sampleBib);
    expect(proposed.title).toBe('Example Paper Title');
    expect(proposed.year).toBe(2025);
    expect(proposed.venue).toBe('Example Venue');
    expect(proposed.doi).toBe('10.0000/example');
    expect(proposed.authors.map((a) => a.name)).toEqual([
      'Researcher, A.',
      'Collaborator, B.',
    ]);
    expect(proposed.publicationType).toBe('journal');
    expect(parseWarnings).toEqual([]);
  });

  it('throws on empty input', () => {
    expect(() => parsePublicationFromBibTeX('')).toThrow(BadRequestException);
  });

  it('maps inproceedings to conference', () => {
    const bib = `@inproceedings{conf2024,
  title = {Conf Paper},
  author = {Smith, J.},
  year = {2024},
  booktitle = {ICML}
}`;
    const { proposed } = parsePublicationFromBibTeX(bib);
    expect(proposed.publicationType).toBe('conference');
    expect(proposed.venue).toBe('ICML');
  });
});
