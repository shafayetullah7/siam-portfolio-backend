import type { TimelineEntryRow } from './timeline.types';

export function timelineEntryRow(
  overrides: Partial<TimelineEntryRow> = {},
): TimelineEntryRow {
  const now = new Date();
  return {
    id: 'entry-1',
    kind: 'award',
    slug: null,
    title: 'Sample award',
    subtitle: null,
    summary: null,
    organization: 'Org',
    location: null,
    startDate: '2024-01-01',
    endDate: null,
    isOngoing: false,
    isCurrent: null,
    proofUrl: null,
    rankOrPlacement: null,
    eventName: null,
    credentialId: null,
    expiresAt: null,
    featured: false,
    sortOrder: 0,
    publicationId: null,
    projectId: null,
    seoTitle: null,
    seoDescription: null,
    hideFromSearch: false,
    metadata: null,
    publishStatus: 'draft',
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
