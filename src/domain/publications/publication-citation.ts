import type { PublicationType } from './publications.types';

export type PublicationCitationInput = {
  slug: string;
  title: string;
  authors: { name: string }[];
  year: number;
  venue: string;
  publicationType: PublicationType;
  doi?: string | null;
  peerReviewed?: boolean;
};

export type PublicationCitationResult = {
  citeKey: string;
  bibtex: string;
  formatted: string;
};

export function citeKeyFromSlug(slug: string): string {
  let key = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  if (key === '') {
    key = 'publication';
  }
  if (/^\d/.test(key)) {
    key = `pub-${key}`;
  }
  return key;
}

export function escapeBibTeXValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}');
}

export function bibtexAuthors(authors: { name: string }[]): string {
  const names = authors
    .map((a) => a.name.trim())
    .filter((name) => name.length > 0);
  if (names.length === 0) {
    return '';
  }
  return names.map((name) => escapeBibTeXValue(name)).join(' and ');
}

export function bibtexEntryType(
  publicationType: PublicationType,
): 'article' | 'inproceedings' | 'phdthesis' | 'misc' {
  switch (publicationType) {
    case 'journal':
      return 'article';
    case 'conference':
    case 'workshop':
      return 'inproceedings';
    case 'thesis':
      return 'phdthesis';
    case 'preprint':
    case 'other':
    default:
      return 'misc';
  }
}

function formatAuthorList(authors: { name: string }[]): string {
  const names = authors
    .map((a) => a.name.trim())
    .filter((name) => name.length > 0);
  if (names.length === 0) {
    return '';
  }
  if (names.length === 1) {
    return names[0];
  }
  if (names.length === 2) {
    return `${names[0]} & ${names[1]}`;
  }
  return `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`;
}

export function formatFormattedCitation(
  input: PublicationCitationInput,
): string {
  const authors = formatAuthorList(input.authors);
  const title = input.title.trim();
  const venue = input.venue.trim();
  const parts: string[] = [];
  if (authors) {
    parts.push(`${authors} (${input.year}).`);
  } else {
    parts.push(`(${input.year}).`);
  }
  parts.push(`${title}.`);
  if (venue) {
    parts.push(`${venue}.`);
  }
  const doi = input.doi?.trim();
  if (doi) {
    parts.push(`https://doi.org/${doi}`);
  }
  return parts.join(' ');
}

export function formatBibTeX(input: PublicationCitationInput): string {
  const citeKey = citeKeyFromSlug(input.slug);
  const entryType = bibtexEntryType(input.publicationType);
  const authorLine = bibtexAuthors(input.authors);
  const lines: string[] = [`@${entryType}{${citeKey},`];
  lines.push(`  title   = {${escapeBibTeXValue(input.title.trim())}},`);
  if (authorLine) {
    lines.push(`  author  = {${authorLine}},`);
  }
  lines.push(`  year    = {${input.year}},`);

  const venue = input.venue.trim();
  if (venue) {
    if (entryType === 'article') {
      lines.push(`  journal = {${escapeBibTeXValue(venue)}},`);
    } else if (entryType === 'inproceedings') {
      lines.push(`  booktitle = {${escapeBibTeXValue(venue)}},`);
    } else if (entryType === 'phdthesis') {
      lines.push(`  school = {${escapeBibTeXValue(venue)}},`);
    } else {
      lines.push(`  howpublished = {${escapeBibTeXValue(venue)}},`);
    }
  }

  const doi = input.doi?.trim();
  if (doi) {
    lines.push(`  doi     = {${escapeBibTeXValue(doi)}},`);
  }

  lines.push('}');
  return lines.join('\n');
}

export function formatCitation(
  input: PublicationCitationInput,
): PublicationCitationResult {
  const citeKey = citeKeyFromSlug(input.slug);
  return {
    citeKey,
    bibtex: formatBibTeX(input),
    formatted: formatFormattedCitation(input),
  };
}
