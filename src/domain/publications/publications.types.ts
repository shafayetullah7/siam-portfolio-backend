import type { PublishStatus } from '../../common/publishing/publish-status';
import type { publications } from '../../db/schema/publications';

export type PublicationRow = typeof publications.$inferSelect;

export type ListAdminPublicationsQuery = {
  q?: string;
  publishStatus?: PublishStatus;
  limit?: number;
};

export type PublicationPublicCard = {
  slug: string;
  title: string;
  authorsShort: string;
  year: number;
  venue: string;
  significance?: string;
  href: string;
};
