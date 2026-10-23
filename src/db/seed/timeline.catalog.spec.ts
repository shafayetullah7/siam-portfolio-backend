import { describe, expect, it } from 'vitest';
import { timelinePublishChecklist } from '../../domain/timeline/timeline-publish-checklist';
import { timelineEntryRow } from '../../domain/timeline/timeline.test-helpers';
import {
  SHOWCASE_AWARD_SLUG,
  timelineCatalog,
} from './timeline.catalog';

describe('timeline.catalog', () => {
  it('includes multiple published P09 kinds', () => {
    const publishedP09 = timelineCatalog.filter(
      (e) =>
        e.publishStatus === 'published' &&
        ['award', 'certification', 'competition', 'scholarship_fellowship_grant', 'recognition_service'].includes(
          e.kind,
        ),
    );
    const kinds = new Set(publishedP09.map((e) => e.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(2);
  });

  it('showcase award passes publish checklist with two gallery alts', () => {
    const showcase = timelineCatalog.find((e) => e.slug === SHOWCASE_AWARD_SLUG);
    expect(showcase).toBeDefined();
    expect(showcase!.galleryImages?.length).toBeGreaterThanOrEqual(2);

    const row = timelineEntryRow({
      kind: showcase!.kind,
      slug: showcase!.slug,
      title: showcase!.title,
      organization: showcase!.organization ?? 'Org',
      proofUrl: showcase!.proofUrl ?? null,
      publishStatus: 'published',
      publishedAt: new Date(),
    });

    const mediaContext = showcase!.galleryImages!.map((img, index) => ({
      mediaId: `media-${index}`,
      alt: img.alt,
      missing: false,
    }));

    const result = timelinePublishChecklist(row, mediaContext);
    expect(result.errors).toHaveLength(0);
  });
});
