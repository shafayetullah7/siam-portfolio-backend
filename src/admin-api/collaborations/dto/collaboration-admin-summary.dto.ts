import type { PublishStatus } from '../../../common/publishing/publish-status';

export type CollaborationAdminSummary = {
  id: string;
  partnerName: string;
  institution: string | null;
  publishStatus: PublishStatus;
  sortOrder: number;
  updatedAt: string;
};
