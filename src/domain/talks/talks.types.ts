import type { PublishStatus } from '../../common/publishing/publish-status';
import type {
  academicServiceEntries,
  academicServiceTypeEnum,
} from '../../db/schema/talks/academic-service-entries';
import type { collaborations } from '../../db/schema/talks/collaborations';
import type { talkResources } from '../../db/schema/talks/talk-resources';
import type {
  talkResourceTypeEnum,
  talkRoleEnum,
  talkTypeEnum,
  talks,
} from '../../db/schema/talks/talks';

export type TalkRow = typeof talks.$inferSelect;
export type TalkResourceRow = typeof talkResources.$inferSelect;
export type CollaborationRow = typeof collaborations.$inferSelect;
export type AcademicServiceEntryRow = typeof academicServiceEntries.$inferSelect;

export type TalkRole = (typeof talkRoleEnum.enumValues)[number];
export type TalkType = (typeof talkTypeEnum.enumValues)[number];
export type TalkResourceType = (typeof talkResourceTypeEnum.enumValues)[number];

export type CreateTalkInput = {
  slug: string;
  title: string;
  eventName: string;
  timezone: string;
  startsAt: Date;
  venue?: string | null;
  location?: string | null;
  isOnline?: boolean;
  endsAt?: Date | null;
  role?: TalkRole;
  talkType?: TalkType;
  description?: string | null;
  sortOrder?: number;
  hideFromSearch?: boolean;
  publishStatus?: PublishStatus;
};

export type UpdateTalkInput = Partial<CreateTalkInput>;

export type PublishTalkOptions = {
  confirmWarnings?: boolean;
};

export type ListAdminTalksSort =
  | 'updatedAtDesc'
  | 'startsAtDesc'
  | 'startsAtAsc'
  | 'titleAsc';

export type ListAdminTalksQuery = {
  q?: string;
  publishStatus?: PublishStatus;
  talkType?: TalkType;
  page?: number;
  limit?: number;
  sort?: ListAdminTalksSort;
};

export type ReplaceTalkResourcesInput = {
  resources: { resourceType?: TalkResourceType; label: string; url: string }[];
};

export type TalkRelations = {
  publicationIds: string[];
  projectIds: string[];
  themeIds: string[];
};

export type ReplaceTalkRelationsInput = {
  publicationIds?: string[];
  projectIds?: string[];
  themeIds?: string[];
};

export type TalkPublicResource = {
  label: string;
  url: string;
  resourceType: TalkResourceType;
};

/** Slim card on research theme detail `related.talks` (requirements §7.6). */
export type TalkThemeRelatedCard = {
  slug: string;
  title: string;
  eventName: string;
  startsAt: string;
  talkType: TalkType;
};

export type TalkPublicCard = {
  slug: string;
  title: string;
  eventName: string;
  startsAt: string;
  timezone: string;
  role: TalkRole;
  talkType: TalkType;
  isOnline: boolean;
  location?: string | null;
  venue?: string | null;
  description?: string | null;
};

export type TalkPublicDetail = TalkPublicCard & {
  endsAt?: string | null;
  resources: TalkPublicResource[];
  related: {
    publications: [];
    projects: [];
    themes: [];
  };
};

export type TalkPublicHub = {
  upcoming: TalkPublicCard[];
  past: TalkPublicCard[];
};

export type CreateCollaborationInput = {
  partnerName: string;
  summary: string;
  institution?: string | null;
  logoMediaId?: string | null;
  role?: string | null;
  period?: string | null;
  outcomes?: string | null;
  sortOrder?: number;
  publishStatus?: PublishStatus;
};

export type UpdateCollaborationInput = Partial<CreateCollaborationInput>;

export type ListAdminCollaborationsSort =
  | 'updatedAtDesc'
  | 'sortOrderAsc'
  | 'partnerNameAsc';

export type ListAdminCollaborationsQuery = {
  q?: string;
  publishStatus?: PublishStatus;
  page?: number;
  limit?: number;
  sort?: ListAdminCollaborationsSort;
};

export type CollaborationPublicCard = {
  partnerName: string;
  institution?: string | null;
  role?: string | null;
  period?: string | null;
  summary: string;
  outcomes?: string | null;
  logo: { url: string; alt: string } | null;
};

export type AcademicServiceType =
  (typeof academicServiceTypeEnum.enumValues)[number];

export type CreateAcademicServiceInput = {
  organization: string;
  roleTitle: string;
  serviceType?: AcademicServiceType;
  startYear?: number | null;
  endYear?: number | null;
  proofUrl?: string | null;
  summary?: string | null;
  sortOrder?: number;
  publishStatus?: PublishStatus;
};

export type UpdateAcademicServiceInput = Partial<CreateAcademicServiceInput>;

export type ListAdminAcademicServiceSort =
  | 'updatedAtDesc'
  | 'sortOrderAsc'
  | 'startYearDesc';

export type ListAdminAcademicServiceQuery = {
  q?: string;
  publishStatus?: PublishStatus;
  serviceType?: AcademicServiceType;
  page?: number;
  limit?: number;
  sort?: ListAdminAcademicServiceSort;
};

export type AcademicServicePublicRow = {
  serviceType: AcademicServiceType;
  organization: string;
  roleTitle: string;
  startYear?: number | null;
  endYear?: number | null;
  proofUrl?: string | null;
  summary?: string | null;
};
