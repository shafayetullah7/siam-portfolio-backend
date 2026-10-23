import { BadRequestException } from '@nestjs/common';
import type { publicationSupplements } from '../../db/schema/publication-supplements';

export type PublicationSupplementKind =
  (typeof publicationSupplements.$inferSelect)['kind'];

export type PublicationSupplementInput = {
  label: string;
  url: string;
  kind?: PublicationSupplementKind;
};

export type NormalizedPublicationSupplement = PublicationSupplementInput & {
  sortOrder: number;
  kind: PublicationSupplementKind;
};

const HTTPS_URL = /^https:\/\/.+/i;

function trimOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t === '' ? null : t;
}

export function normalizeSupplementInputs(
  supplements: PublicationSupplementInput[],
): NormalizedPublicationSupplement[] {
  const normalized: NormalizedPublicationSupplement[] = [];
  for (const row of supplements) {
    const label = row.label?.trim() ?? '';
    const url = row.url?.trim() ?? '';
    if (!label && !url) continue;
    if (!label || !url) {
      throw new BadRequestException(
        'Each supplement must have both a label and a URL',
      );
    }
    if (url.length > 2000) {
      throw new BadRequestException('Supplement URL is too long');
    }
    if (!HTTPS_URL.test(url)) {
      throw new BadRequestException(
        'Supplement URLs must use https://',
      );
    }
    normalized.push({
      sortOrder: normalized.length,
      label,
      url,
      kind: row.kind ?? 'other',
    });
  }
  return normalized;
}
