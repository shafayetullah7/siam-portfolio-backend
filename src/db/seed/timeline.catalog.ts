/**
 * Dev seed for timeline (P09 + P10). Maps loosely to
 * docs/content-packet/recognition-talks.md and education-career.md.
 */

export type TimelineGalleryImageSeed = {
  fileName: string;
  url: string;
  alt: string;
  sortOrder: number;
  caption?: string;
  imageRole?: 'certificate' | 'photo' | 'badge' | 'logo';
};

export type TimelineSeedEntry = {
  kind:
    | 'award'
    | 'competition'
    | 'scholarship_fellowship_grant'
    | 'certification'
    | 'recognition_service'
    | 'education'
    | 'research_experience'
    | 'industry_experience'
    | 'teaching_mentoring'
    | 'affiliation';
  slug: string;
  title: string;
  subtitle?: string;
  summary?: string;
  organization?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isOngoing?: boolean;
  isCurrent?: boolean;
  proofUrl?: string;
  rankOrPlacement?: string;
  credentialId?: string;
  expiresAt?: string;
  featured?: boolean;
  sortOrder?: number;
  publishStatus?: 'draft' | 'published' | 'scheduled' | 'archived';
  galleryImages?: TimelineGalleryImageSeed[];
  linkPublicationSlug?: string;
  linkProjectSlug?: string;
};

export const SHOWCASE_AWARD_SLUG = 'dev-showcase-award';

export const timelineCatalog: readonly TimelineSeedEntry[] = [
  {
    kind: 'award',
    slug: SHOWCASE_AWARD_SLUG,
    title: 'Outstanding research contribution',
    organization: 'Example scientific society',
    startDate: '2024-06-01',
    summary:
      'Recognized for reproducible evaluation work and open artifacts accompanying published results.',
    proofUrl: 'https://example.com/verify/award',
    featured: true,
    sortOrder: 0,
    publishStatus: 'published',
    galleryImages: [
      {
        fileName: 'timeline-seed-award-cert.jpg',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        alt: 'Certificate scan for dev showcase award',
        sortOrder: 0,
        imageRole: 'certificate',
      },
      {
        fileName: 'timeline-seed-award-photo.jpg',
        url: 'https://res.cloudinary.com/demo/image/upload/woman.jpg',
        alt: 'Event photo from award ceremony (dev seed)',
        sortOrder: 1,
        imageRole: 'photo',
        caption: 'Ceremony photo (placeholder)',
      },
    ],
  },
  {
    kind: 'certification',
    slug: 'dev-cloud-cert',
    title: 'Cloud practitioner (sample)',
    organization: 'Example cloud vendor',
    startDate: '2023-01-01',
    expiresAt: '2020-01-01',
    credentialId: 'CERT-DEV-001',
    proofUrl: 'https://example.com/verify/cert',
    sortOrder: 1,
    publishStatus: 'published',
  },
  {
    kind: 'recognition_service',
    slug: 'dev-service-draft',
    title: 'Program committee (draft)',
    organization: 'Example conference',
    startDate: '2025-01-01',
    endDate: '2025-12-01',
    summary: 'Draft entry for admin publish workflow demos.',
    sortOrder: 2,
    publishStatus: 'draft',
  },
  {
    kind: 'education',
    slug: 'dev-msc-degree',
    title: 'MSc Computer Science',
    subtitle: 'Machine learning',
    organization: 'Example University',
    location: 'UK',
    startDate: '2018-09-01',
    endDate: '2020-06-01',
    summary: 'Thesis on robust evaluation for small data regimes.',
    sortOrder: 0,
    publishStatus: 'published',
  },
  {
    kind: 'research_experience',
    slug: 'dev-research-role',
    title: 'Research associate',
    organization: 'Example Lab',
    startDate: '2021-01-01',
    isOngoing: true,
    isCurrent: true,
    summary: 'Interpretability and reliable benchmarking for applied ML systems.',
    sortOrder: 1,
    publishStatus: 'published',
  },
  {
    kind: 'teaching_mentoring',
    slug: 'dev-teaching-draft',
    title: 'Graduate seminar (draft)',
    organization: 'Example University',
    startDate: '2024-01-01',
    endDate: '2024-05-01',
    sortOrder: 3,
    publishStatus: 'draft',
  },
];
