import type { TalkRow } from './talks.types';

export type PublishChecklistItem = {
  code: string;
  message: string;
};

export type TalkPublishChecklistResult = {
  errors: PublishChecklistItem[];
  warnings: PublishChecklistItem[];
};

export type TalkPublishChecklistContext = {
  resourceCount: number;
  slugTaken: boolean;
};

export const MIN_TALK_DESCRIPTION_CHARS = 80;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isEmpty(value: string | null | undefined): boolean {
  return !value?.trim();
}

export function isValidIanaTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz.trim() });
    return true;
  } catch {
    return false;
  }
}

export function talkPublishChecklist(
  row: TalkRow,
  context: TalkPublishChecklistContext,
): TalkPublishChecklistResult {
  const errors: PublishChecklistItem[] = [];
  const warnings: PublishChecklistItem[] = [];

  if (isEmpty(row.title)) {
    errors.push({ code: 'title_required', message: 'Title is required' });
  }
  const slug = row.slug.trim();
  if (!slug) {
    errors.push({ code: 'slug_required', message: 'Slug is required' });
  } else if (!SLUG_PATTERN.test(slug)) {
    errors.push({
      code: 'slug_format',
      message: 'Slug must use lowercase letters, numbers, and hyphens',
    });
  } else if (context.slugTaken) {
    errors.push({
      code: 'slug_taken',
      message: 'Another talk already uses this slug',
    });
  }
  if (isEmpty(row.eventName)) {
    errors.push({ code: 'event_required', message: 'Event name is required' });
  }
  if (!row.startsAt || Number.isNaN(row.startsAt.getTime())) {
    errors.push({ code: 'starts_at_required', message: 'Start date is required' });
  }
  if (isEmpty(row.timezone)) {
    errors.push({ code: 'timezone_required', message: 'Timezone is required' });
  } else if (!isValidIanaTimezone(row.timezone)) {
    errors.push({
      code: 'timezone_invalid',
      message: 'Timezone must be a valid IANA identifier',
    });
  }

  if (context.resourceCount === 0) {
    warnings.push({
      code: 'no_materials',
      message: 'No slides, video, or other materials are linked yet',
    });
  }
  const descLen = row.description?.trim().length ?? 0;
  if (descLen > 0 && descLen < MIN_TALK_DESCRIPTION_CHARS) {
    warnings.push({
      code: 'short_description',
      message: `Description is shorter than ${MIN_TALK_DESCRIPTION_CHARS} characters`,
    });
  } else if (descLen === 0) {
    warnings.push({
      code: 'short_description',
      message: 'Description is empty',
    });
  }
  if (row.role === 'attendee') {
    warnings.push({
      code: 'attendee_role',
      message: 'Attendee rows are usually kept as drafts on the public site',
    });
  }

  return { errors, warnings };
}
