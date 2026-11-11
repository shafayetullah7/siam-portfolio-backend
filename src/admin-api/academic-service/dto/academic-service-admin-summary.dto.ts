import type { PublishStatus } from '../../../common/publishing/publish-status';
import type { AcademicServiceType } from '../../../domain/talks/talks.types';

export type AcademicServiceAdminSummary = {
  id: string;
  organization: string;
  roleTitle: string;
  serviceType: AcademicServiceType;
  publishStatus: PublishStatus;
  sortOrder: number;
  updatedAt: string;
};
