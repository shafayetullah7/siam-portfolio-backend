import { BadRequestException } from '@nestjs/common';
import {
  ALL_TIMELINE_KINDS,
  type TimelineEntryKind,
} from './timeline-kinds';

export type TimelineDateFields = {
  startDate?: string | null;
  endDate?: string | null;
  isOngoing?: boolean;
};

export function normalizeTimelineSlug(
  slug: string | null | undefined,
): string | null {
  if (slug == null) return null;
  const trimmed = slug.trim();
  return trimmed === '' ? null : trimmed;
}

export function assertValidTimelineKind(kind: string): TimelineEntryKind {
  if (!ALL_TIMELINE_KINDS.includes(kind as TimelineEntryKind)) {
    throw new BadRequestException(`Invalid timeline entry kind: ${kind}`);
  }
  return kind as TimelineEntryKind;
}

export function validateTimelineDateFields(fields: TimelineDateFields): void {
  const { startDate, endDate, isOngoing } = fields;
  if (isOngoing && endDate != null && endDate !== '') {
    throw new BadRequestException(
      'endDate must be empty when isOngoing is true',
    );
  }
  if (
    startDate &&
    endDate &&
    startDate > endDate
  ) {
    throw new BadRequestException('startDate must be on or before endDate');
  }
}

export function mergeDateFieldsForValidation(
  existing: TimelineDateFields,
  patch: TimelineDateFields,
): TimelineDateFields {
  return {
    startDate:
      patch.startDate !== undefined ? patch.startDate : existing.startDate,
    endDate: patch.endDate !== undefined ? patch.endDate : existing.endDate,
    isOngoing:
      patch.isOngoing !== undefined ? patch.isOngoing : existing.isOngoing,
  };
}
