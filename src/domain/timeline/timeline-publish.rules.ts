import { BadRequestException } from '@nestjs/common';
import {
  timelinePublishChecklist,
  type TimelinePublishChecklistMediaContext,
} from './timeline-publish-checklist';
import type { TimelineEntryRow } from './timeline.types';

export function assertPublishable(
  row: TimelineEntryRow,
  media: TimelinePublishChecklistMediaContext[] = [],
): void {
  const { errors } = timelinePublishChecklist(row, media);
  if (errors.length > 0) {
    throw new BadRequestException(errors.map((item) => item.message).join('; '));
  }
}
