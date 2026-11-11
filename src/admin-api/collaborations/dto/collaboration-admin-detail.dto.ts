import type { PublishStatus } from '../../../common/publishing/publish-status';

export type CollaborationAdminDetail = {
  id: string;
  partnerName: string;
  institution: string | null;
  logoMediaId: string | null;
  role: string | null;
  period: string | null;
  summary: string;
  outcomes: string | null;
  sortOrder: number;
  publishStatus: PublishStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
