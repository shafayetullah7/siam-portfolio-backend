import { BadRequestException } from '@nestjs/common';

const AUTHORS_SHORT_MAX = 300;

export type PublicationAuthorInput = {
  name: string;
  affiliation?: string | null;
  orcid?: string | null;
};

export type NormalizedPublicationAuthor = PublicationAuthorInput & {
  sortOrder: number;
};

function trimOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t === '' ? null : t;
}

export function normalizeAuthorInputs(
  authors: PublicationAuthorInput[],
): NormalizedPublicationAuthor[] {
  const normalized: NormalizedPublicationAuthor[] = [];
  for (const author of authors) {
    const name = author.name?.trim() ?? '';
    if (!name) continue;
    normalized.push({
      sortOrder: normalized.length,
      name,
      affiliation: trimOptional(author.affiliation),
      orcid: trimOptional(author.orcid),
    });
  }
  if (normalized.length === 0) {
    throw new BadRequestException('At least one author name is required');
  }
  return normalized;
}

export function formatAuthorsShort(
  authors: readonly { name: string }[],
): string {
  const joined = authors.map((a) => a.name.trim()).filter(Boolean).join(', ');
  if (joined.length <= AUTHORS_SHORT_MAX) {
    return joined;
  }
  return `${joined.slice(0, AUTHORS_SHORT_MAX - 1)}…`;
}
