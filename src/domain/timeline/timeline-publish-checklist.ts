import type { TimelineEntryRow } from './timeline.types';
import { isAchievementKind, type TimelineEntryKind } from './timeline-kinds';

export type PublishChecklistItem = {
  code: string;
  message: string;
};

export type TimelinePublishChecklistMediaContext = {
  mediaId: string;
  alt: string | null;
  mediaMissing?: boolean;
};

export type TimelinePublishChecklistResult = {
  errors: PublishChecklistItem[];
  warnings: PublishChecklistItem[];
};

const PROOF_URL_KINDS = new Set<TimelineEntryKind>([
  'award',
  'competition',
  'scholarship_fellowship_grant',
]);

function isEmpty(value: string | null | undefined): boolean {
  return !value?.trim();
}

function parseDateValue(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.length === 7 ? `${trimmed}-01` : trimmed;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isDateInPast(value: string | null | undefined, now = new Date()): boolean {
  if (!value?.trim()) return false;
  const date = parseDateValue(value);
  if (!date) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const compare = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return compare.getTime() < today.getTime();
}

function datesOutOfOrder(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): boolean {
  if (!startDate?.trim() || !endDate?.trim()) return false;
  return startDate.trim() > endDate.trim();
}

export function timelinePublishChecklist(
  row: TimelineEntryRow,
  media: TimelinePublishChecklistMediaContext[] = [],
): TimelinePublishChecklistResult {
  const errors: PublishChecklistItem[] = [];
  const warnings: PublishChecklistItem[] = [];
  const kind = row.kind as TimelineEntryKind;

  if (isEmpty(row.title)) {
    errors.push({ code: 'title_required', message: 'Title is required' });
  }
  if (!kind) {
    errors.push({ code: 'kind_required', message: 'Entry kind is required' });
  }

  if (datesOutOfOrder(row.startDate, row.endDate)) {
    errors.push({
      code: 'date_order_invalid',
      message: 'End date must be on or after start date',
    });
  }

  if (
    kind === 'certification' &&
    row.isCurrent === true &&
    isDateInPast(row.expiresAt)
  ) {
    errors.push({
      code: 'certification_current_expired',
      message:
        'Cannot mark certification as current when the expiration date is in the past',
    });
  }

  for (const link of media) {
    if (link.mediaMissing) {
      errors.push({
        code: 'image_media_missing',
        message: `Gallery media not found: ${link.mediaId}`,
      });
      continue;
    }
    if (isEmpty(link.alt)) {
      errors.push({
        code: 'image_alt_missing',
        message: 'Every gallery image must have alt text in the media library',
      });
      break;
    }
  }

  if (kind && PROOF_URL_KINDS.has(kind) && isEmpty(row.proofUrl)) {
    warnings.push({
      code: 'proof_url_missing',
      message: 'Consider adding a proof URL for verifiability',
    });
  }

  if (kind && isAchievementKind(kind) && media.length === 0) {
    warnings.push({
      code: 'achievement_no_images',
      message: 'Achievement entries usually include at least one image',
    });
  }

  if (kind === 'certification' && isDateInPast(row.expiresAt)) {
    warnings.push({
      code: 'certification_expired',
      message: 'This certification expiration date is in the past',
    });
  }

  if (isEmpty(row.organization)) {
    warnings.push({
      code: 'organization_missing',
      message: 'Organization name is missing',
    });
  }

  return { errors, warnings };
}
