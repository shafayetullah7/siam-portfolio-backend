import { z } from 'zod';
import { ALL_TIMELINE_KINDS } from '../../../domain/timeline/timeline-kinds';

export const timelineEntryKindSchema = z.enum(ALL_TIMELINE_KINDS);

export type TimelineEntryKindDto = z.infer<typeof timelineEntryKindSchema>;
