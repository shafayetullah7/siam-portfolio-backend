import type { PublishStatus } from '../../common/publishing/publish-status';
import type { projects } from '../../db/schema/projects';

export type ProjectRow = typeof projects.$inferSelect;

export type ListAdminProjectsQuery = {
  q?: string;
  publishStatus?: PublishStatus;
  limit?: number;
};

export type ProjectPublicCard = {
  slug: string;
  title: string;
  summary: string;
  tags?: string[];
  href: string;
};
