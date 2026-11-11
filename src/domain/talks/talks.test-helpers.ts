import type { TalkRow } from './talks.types';

export function talkRow(overrides: Partial<TalkRow> = {}): TalkRow {
  const now = new Date('2026-06-01T12:00:00.000Z');
  return {
    id: 'talk-1',
    slug: 'sample-talk',
    title: 'Sample Talk',
    eventName: 'Sample Conf',
    venue: null,
    location: 'City',
    isOnline: false,
    startsAt: now,
    endsAt: null,
    timezone: 'Europe/London',
    role: 'speaker',
    talkType: 'conference_talk',
    description: 'A short blurb',
    sortOrder: 0,
    hideFromSearch: false,
    publishStatus: 'draft',
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
