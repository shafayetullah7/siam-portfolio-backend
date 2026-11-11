import type { PublishStatus } from '../../../common/publishing/publish-status';
import type { AcademicServiceType } from '../../../domain/talks/talks.types';

export type AcademicServiceAdminDetail = {
  id: string;
  serviceType: AcademicServiceType;
  organization: string;
  roleTitle: string;
  startYear: number | null;
  endYear: number | null;
  proofUrl: string | null;
  summary: string | null;
  sortOrder: number;
  publishStatus: PublishStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
