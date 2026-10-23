import { describe, expect, it } from 'vitest';
import {
  citeKeyFromSlug,
  escapeBibTeXValue,
  formatBibTeX,
  formatCitation,
  formatFormattedCitation,
} from './publication-citation';

describe('publication-citation', () => {
  const base = {
    slug: 'my-paper',
    title: 'Example Title',
    authors: [{ name: 'Alice' }, { name: 'Bob' }],
    year: 2024,
    venue: 'NeurIPS',
    publicationType: 'conference' as const,
    doi: '10.1234/example',
  };

  it('citeKeyFromSlug normalizes slug', () => {
    expect(citeKeyFromSlug('My-Paper_2024')).toBe('my-paper-2024');
    expect(citeKeyFromSlug('2024-paper')).toBe('pub-2024-paper');
  });

  it('escapes special characters in BibTeX title', () => {
    const bib = formatBibTeX({
      ...base,
      title: 'GPU{memory} and \\paths',
      authors: [{ name: 'Author' }],
    });
    expect(bib).toContain('GPU\\{memory\\} and \\\\paths');
  });

  it('preserves author order in BibTeX', () => {
    const bib = formatBibTeX(base);
    expect(bib).toContain('author  = {Alice and Bob}');
  });

  it('uses inproceedings and booktitle for conference', () => {
    const bib = formatBibTeX(base);
    expect(bib).toMatch(/^@inproceedings\{my-paper,/);
    expect(bib).toContain('booktitle = {NeurIPS}');
  });

  it('includes DOI in BibTeX and formatted citation', () => {
    const result = formatCitation(base);
    expect(result.bibtex).toContain('doi     = {10.1234/example}');
    expect(result.formatted).toContain('https://doi.org/10.1234/example');
  });

  it('formats readable citation with ampersand between two authors', () => {
    const formatted = formatFormattedCitation(base);
    expect(formatted).toContain('Alice & Bob (2024).');
    expect(formatted).toContain('Example Title.');
  });

  it('escapeBibTeXValue escapes braces and backslashes', () => {
    expect(escapeBibTeXValue('a{b}\\c')).toBe('a\\{b\\}\\\\c');
  });
});
