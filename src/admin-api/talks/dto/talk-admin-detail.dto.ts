import type { PublishStatus } from '../../../common/publishing/publish-status';
import type {
  TalkRelations,
  TalkResourceType,
  TalkRole,
  TalkType,
} from '../../../domain/talks/talks.types';

export type TalkResourceAdminDto = {
  id: string;
  label: string;
  url: string;
  resourceType: TalkResourceType;
  sortOrder: number;
};

export type TalkAdminDetail = {
  id: string;
  slug: string;
  title: string;
  eventName: string;
  venue: string | null;
  location: string | null;
  isOnline: boolean;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  role: TalkRole;
  talkType: TalkType;
  description: string | null;
  sortOrder: number;
  hideFromSearch: boolean;
  publishStatus: PublishStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resources: TalkResourceAdminDto[];
  relations: TalkRelations;
};
