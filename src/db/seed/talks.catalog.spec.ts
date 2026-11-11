import { describe, expect, it } from 'vitest';
import { talkPublishChecklist } from '../../domain/talks/talk-publish-checklist';
import { talkRow } from '../../domain/talks/talks.test-helpers';
import {
  academicServiceCatalog,
  collaborationsCatalog,
  DEV_DRAFT_TALK_SLUG,
  DEV_UPCOMING_TALK_SLUG,
  talksCatalog,
} from './talks.catalog';

describe('talks.catalog', () => {
  it('uses unique talk slugs', () => {
    const slugs = talksCatalog.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has three published talks and one draft', () => {
    const published = talksCatalog.filter((t) => t.publishStatus === 'published');
    const draft = talksCatalog.filter((t) => t.publishStatus === 'draft');
    expect(published).toHaveLength(3);
    expect(draft).toHaveLength(1);
    expect(draft[0]!.slug).toBe(DEV_DRAFT_TALK_SLUG);
  });

  it('orders upcoming talk after past talks by startsAt', () => {
    const upcoming = talksCatalog.find((t) => t.slug === DEV_UPCOMING_TALK_SLUG)!;
    const past = talksCatalog.filter(
      (t) => t.publishStatus === 'published' && t.slug !== DEV_UPCOMING_TALK_SLUG,
    );
    for (const p of past) {
      expect(new Date(upcoming.startsAt).getTime()).toBeGreaterThan(
        new Date(p.startsAt).getTime(),
      );
    }
  });

  it('has one published and one draft collaboration', () => {
    expect(
      collaborationsCatalog.filter((c) => c.publishStatus === 'published'),
    ).toHaveLength(1);
    expect(
      collaborationsCatalog.filter((c) => c.publishStatus === 'draft'),
    ).toHaveLength(1);
  });

  it('has two published academic service rows', () => {
    expect(academicServiceCatalog).toHaveLength(2);
    expect(academicServiceCatalog.every((r) => r.publishStatus === 'published')).toBe(
      true,
    );
  });

  it('published talks pass publish checklist with resources', () => {
    for (const entry of talksCatalog.filter((t) => t.publishStatus === 'published')) {
      const row = talkRow({
        slug: entry.slug,
        title: entry.title,
        eventName: entry.eventName,
        timezone: entry.timezone,
        startsAt: new Date(entry.startsAt),
        talkType: entry.talkType ?? 'other',
        description: entry.description ?? null,
        publishStatus: 'published',
      });
      const result = talkPublishChecklist(row, {
        resourceCount: entry.resources?.length ?? 0,
        slugTaken: false,
      });
      expect(result.errors).toHaveLength(0);
    }
  });
});
