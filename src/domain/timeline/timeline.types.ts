import type { PublishStatus } from '../../common/publishing/publish-status';
import type { timelineEntries } from '../../db/schema/timeline/timeline-entries';
import type { timelineEntryMedia } from '../../db/schema/timeline/timeline-entry-media';
import type { TimelineEntryKind } from './timeline-kinds';

export type TimelineEntryRow = typeof timelineEntries.$inferSelect;
export type TimelineEntryMediaRow = typeof timelineEntryMedia.$inferSelect;

export type TimelineImageRole = NonNullable<TimelineEntryMediaRow['imageRole']>;

export type TimelineEntryMediaAdmin = {
  id: string;
  mediaId: string;
  sortOrder: number;
  caption: string | null;
  imageRole: TimelineImageRole | null;
};

export type TimelineEntryAdmin = TimelineEntryRow & {
  media: TimelineEntryMediaAdmin[];
};

export type CreateTimelineEntryInput = {
  kind: TimelineEntryKind;
  title: string;
  slug?: string | null;
  subtitle?: string | null;
  summary?: string | null;
  organization?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isOngoing?: boolean;
  isCurrent?: boolean | null;
  proofUrl?: string | null;
  rankOrPlacement?: string | null;
  eventName?: string | null;
  credentialId?: string | null;
  expiresAt?: string | null;
  featured?: boolean;
  sortOrder?: number;
  publicationId?: string | null;
  projectId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  hideFromSearch?: boolean;
  metadata?: Record<string, unknown> | null;
};

export type UpdateTimelineEntryInput = Partial<CreateTimelineEntryInput>;

export type ReplaceEntryMediaItem = {
  mediaId: string;
  sortOrder: number;
  caption?: string | null;
  imageRole?: TimelineImageRole | null;
};

export type ReplaceEntryMediaInput = ReplaceEntryMediaItem[];

export type TimelinePublicImage = {
  url: string;
  alt: string;
  caption: string | null;
  sortOrder: number;
  imageRole?: TimelineImageRole | null;
};

export type TimelinePublicCard = {
  id: string;
  kind: TimelineEntryKind;
  title: string;
  subtitle: string | null;
  organization: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isOngoing: boolean;
  featured: boolean;
  proofUrl: string | null;
  images: TimelinePublicImage[];
  href?: string;
};

export type TimelinePublicDetail = TimelinePublicCard & {
  summary: string | null;
  rankOrPlacement: string | null;
  eventName: string | null;
  credentialId: string | null;
  expiresAt: string | null;
  isCurrent: boolean | null;
  publicationId: string | null;
  projectId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishStatus: PublishStatus;
  publishedAt: string | null;
};

export const LIST_PUBLIC_TIMELINE_SORTS = [
  'startDateDesc',
  'sortOrderAsc',
  'titleAsc',
] as const;

export type ListPublicTimelineSort =
  (typeof LIST_PUBLIC_TIMELINE_SORTS)[number];

export type ListPublishedByKindsOptions = {
  limit?: number;
  page?: number;
  sort?: ListPublicTimelineSort;
  featuredOnly?: boolean;
  now?: Date;
};

export const LIST_ADMIN_TIMELINE_SORTS = [
  'startDateDesc',
  'updatedAtDesc',
  'titleAsc',
] as const;

export type ListAdminTimelineSort = (typeof LIST_ADMIN_TIMELINE_SORTS)[number];

export type ListAdminTimelineQuery = {
  q?: string;
  kind?: TimelineEntryKind;
  kinds?: TimelineEntryKind[];
  publishStatus?: PublishStatus;
  page?: number;
  limit?: number;
  sort?: ListAdminTimelineSort;
};
