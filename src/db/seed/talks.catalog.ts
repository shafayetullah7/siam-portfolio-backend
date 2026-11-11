/**
 * Dev seed for talks, collaborations, and academic service (M11 / TALK12).
 * Placeholder copy only — see docs/content-packet/recognition-talks.md.
 */

export type TalkResourceSeed = {
  label: string;
  url: string;
  resourceType: 'slides' | 'video' | 'poster' | 'event_page' | 'other';
  sortOrder?: number;
};

export type TalkSeedEntry = {
  slug: string;
  title: string;
  eventName: string;
  timezone: string;
  /** ISO-8601 instant */
  startsAt: string;
  talkType?: 'invited_talk' | 'conference_talk' | 'poster' | 'workshop' | 'other';
  description?: string;
  publishStatus: 'draft' | 'published' | 'scheduled' | 'archived';
  isOnline?: boolean;
  location?: string;
  venue?: string;
  resources?: TalkResourceSeed[];
  linkThemeSlug?: string;
};

export type CollaborationSeedEntry = {
  slugKey: string;
  partnerName: string;
  summary: string;
  institution?: string;
  role?: string;
  period?: string;
  publishStatus: 'draft' | 'published';
};

export type AcademicServiceSeedEntry = {
  slugKey: string;
  organization: string;
  roleTitle: string;
  serviceType: 'reviewing' | 'committee' | 'mentoring' | 'outreach' | 'editorial' | 'other';
  startYear?: number;
  endYear?: number;
  summary?: string;
  proofUrl?: string;
  publishStatus: 'published';
};

export const DEV_UPCOMING_TALK_SLUG = 'dev-upcoming-talk';
export const DEV_PAST_KEYNOTE_SLUG = 'dev-past-keynote-1';
export const DEV_PAST_POSTER_SLUG = 'dev-past-poster';
export const DEV_DRAFT_TALK_SLUG = 'dev-draft-talk';

export const talksCatalog: readonly TalkSeedEntry[] = [
  {
    slug: DEV_UPCOMING_TALK_SLUG,
    title: 'Sample upcoming invited talk (dev)',
    eventName: 'Placeholder ML Colloquium',
    timezone: 'UTC',
    startsAt: '2027-06-15T14:00:00.000Z',
    talkType: 'invited_talk',
    description:
      'Dev-only placeholder for the public talks hub upcoming section. Replace before production.',
    publishStatus: 'published',
    isOnline: true,
    venue: 'Virtual auditorium',
    linkThemeSlug: 'interpretable-representation-learning',
    resources: [
      {
        label: 'Event page',
        url: 'https://example.com/events/dev-upcoming',
        resourceType: 'event_page',
        sortOrder: 0,
      },
    ],
  },
  {
    slug: DEV_PAST_KEYNOTE_SLUG,
    title: 'Sample past keynote (dev)',
    eventName: 'Placeholder Conference',
    timezone: 'America/New_York',
    startsAt: '2024-03-10T18:30:00.000Z',
    talkType: 'conference_talk',
    description:
      'Dev-only past talk for the public hub past section. Replace with verified event metadata.',
    publishStatus: 'published',
    location: 'Boston, MA',
    resources: [
      {
        label: 'Slides (PDF)',
        url: 'https://example.com/slides/dev-keynote.pdf',
        resourceType: 'slides',
      },
    ],
  },
  {
    slug: DEV_PAST_POSTER_SLUG,
    title: 'Sample poster session (dev)',
    eventName: 'Placeholder Workshop',
    timezone: 'UTC',
    startsAt: '2023-11-08T10:00:00.000Z',
    talkType: 'poster',
    description:
      'Dev-only poster entry for hub smoke tests. Not a real venue or event.',
    publishStatus: 'published',
    venue: 'Hall B',
    location: 'Hybrid',
    resources: [
      {
        label: 'Poster PDF',
        url: 'https://example.com/posters/dev-poster.pdf',
        resourceType: 'poster',
      },
    ],
  },
  {
    slug: DEV_DRAFT_TALK_SLUG,
    title: 'Draft talk (dev only)',
    eventName: 'TBD event',
    timezone: 'UTC',
    startsAt: '2028-01-01T12:00:00.000Z',
    talkType: 'other',
    description: 'Intentionally draft for admin dashboard and publish workflow.',
    publishStatus: 'draft',
  },
];

export const collaborationsCatalog: readonly CollaborationSeedEntry[] = [
  {
    slugKey: 'dev-collab-published',
    partnerName: 'Placeholder Lab',
    institution: 'Example University',
    summary:
      'Dev-only collaboration blurb. Replace with partner-approved copy and logo before production.',
    role: 'Research collaboration',
    period: '2024–2026',
    publishStatus: 'published',
  },
  {
    slugKey: 'dev-collab-draft',
    partnerName: 'Confidential partner (draft)',
    summary:
      'Draft collaboration — must not appear on public P14 until published and enabled.',
    publishStatus: 'draft',
  },
];

export const academicServiceCatalog: readonly AcademicServiceSeedEntry[] = [
  {
    slugKey: 'dev-service-reviewing',
    organization: 'Example Journal',
    roleTitle: 'Peer reviewer',
    serviceType: 'reviewing',
    startYear: 2022,
    endYear: 2025,
    summary: 'Placeholder reviewing row for public academic service section.',
    publishStatus: 'published',
  },
  {
    slugKey: 'dev-service-committee',
    organization: 'Example Program Committee',
    roleTitle: 'Area chair',
    serviceType: 'committee',
    startYear: 2024,
    endYear: 2024,
    summary: 'Placeholder committee service for collaborations page smoke.',
    publishStatus: 'published',
  },
];

export const talksSiteDefaults = {
  talksHubIntro:
    'Talks and posters from invited colloquia, conferences, and workshops—dev seed copy; edit on /admin/site.',
  collaborationsPageIntro:
    'Selected partnerships and academic service roles (dev placeholders). Enable and edit before launch.',
  collaborationsPageEnabled: true,
} as const;
