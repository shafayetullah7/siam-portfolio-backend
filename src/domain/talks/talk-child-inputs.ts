import { BadRequestException } from '@nestjs/common';
import type { TalkResourceType } from './talks.types';

export type TalkResourceWrite = {
  resourceType?: TalkResourceType;
  label: string;
  url: string;
};

export type NormalizedTalkResource = {
  sortOrder: number;
  resourceType: TalkResourceType;
  label: string;
  url: string;
};

const HTTPS_URL = /^https:\/\/.+/i;
export const MAX_TALK_RESOURCES = 20;

function trimOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t === '' ? null : t;
}

export function normalizeTalkResourceInputs(
  rows: TalkResourceWrite[],
): NormalizedTalkResource[] {
  if (rows.length > MAX_TALK_RESOURCES) {
    throw new BadRequestException(
      `At most ${MAX_TALK_RESOURCES} resources allowed`,
    );
  }
  const normalized: NormalizedTalkResource[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const label = row.label?.trim() ?? '';
    const url = row.url?.trim() ?? '';
    if (!label) {
      throw new BadRequestException(`Resource ${i + 1}: label is required`);
    }
    if (!url) {
      throw new BadRequestException(`Resource ${i + 1}: url is required`);
    }
    if (!HTTPS_URL.test(url)) {
      throw new BadRequestException(
        `Resource ${i + 1}: url must be an https:// URL`,
      );
    }
    normalized.push({
      sortOrder: i,
      resourceType: row.resourceType ?? 'other',
      label,
      url,
    });
  }
  return normalized;
}

export function trimTalkOptional(
  value: string | null | undefined,
): string | null {
  return trimOptional(value);
}
