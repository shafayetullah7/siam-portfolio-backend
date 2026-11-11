import { BadRequestException } from '@nestjs/common';

export const MAX_TALK_RELATIONS = 20;

export function dedupeIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      unique.push(id);
    }
  }
  return unique;
}

export function assertRelationIdLimits(
  publicationIds: string[],
  projectIds: string[],
  themeIds: string[],
): void {
  for (const [label, ids] of [
    ['publications', publicationIds],
    ['projects', projectIds],
    ['themes', themeIds],
  ] as const) {
    if (ids.length > MAX_TALK_RELATIONS) {
      throw new BadRequestException(
        `At most ${MAX_TALK_RELATIONS} ${label} allowed`,
      );
    }
  }
}
