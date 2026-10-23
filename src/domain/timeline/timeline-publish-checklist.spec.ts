import { describe, expect, it } from 'vitest';
import { timelineEntryRow } from './timeline.test-helpers';
import { timelinePublishChecklist } from './timeline-publish-checklist';

describe('timelinePublishChecklist', () => {
  it('errors when title is empty', () => {
    const result = timelinePublishChecklist(
      timelineEntryRow({ title: '  ' }),
      [],
    );
    expect(result.errors.map((e) => e.code)).toContain('title_required');
  });

  it('errors when end date is before start date', () => {
    const result = timelinePublishChecklist(
      timelineEntryRow({
        startDate: '2024-06',
        endDate: '2024-01',
      }),
      [],
    );
    expect(result.errors.map((e) => e.code)).toContain('date_order_invalid');
  });

  it('errors when gallery image has no alt', () => {
    const result = timelinePublishChecklist(timelineEntryRow(), [
      { mediaId: 'm-1', alt: '' },
    ]);
    expect(result.errors.map((e) => e.code)).toContain('image_alt_missing');
  });

  it('warns when award has no proof URL or images', () => {
    const result = timelinePublishChecklist(
      timelineEntryRow({ kind: 'award', proofUrl: null }),
      [],
    );
    expect(result.warnings.map((w) => w.code)).toEqual(
      expect.arrayContaining(['proof_url_missing', 'achievement_no_images']),
    );
  });
});
