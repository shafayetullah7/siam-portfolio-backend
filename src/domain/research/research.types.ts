import type { PublishStatus } from '../../common/publishing/publish-status';
import type {
  researchThemeResources,
  researchThemes,
} from '../../db/schema/research';

export type ResearchThemeRow = typeof researchThemes.$inferSelect;

export type ResearchThemePublicLinkCard = {
  slug: string;
  title: string;
  summary: string;
  href: string;
};
export type ResearchThemeResourceRow =
  typeof researchThemeResources.$inferSelect;
export type ResearchThemeStatus = ResearchThemeRow['themeStatus'];
export type ResearchThemeResourceType =
  ResearchThemeResourceRow['resourceType'];

export type ResearchThemeResourceInput = {
  label: string;
  url: string;
  resourceType: ResearchThemeResourceType;
  sortOrder?: number;
};

export type CreateResearchThemeInput = {
  slug: string;
  title: string;
  summary: string;
  themeStatus?: ResearchThemeStatus;
  problem?: string;
  significance?: string | null;
  objectives?: string | null;
  approach?: string | null;
  findings?: string | null;
  limitations?: string | null;
  futureWork?: string | null;
  tags?: string[] | null;
  linkLabel?: string | null;
  coverMediaId?: string | null;
  sortOrder?: number;
  featuredOnHome?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  collaborators?: ResearchThemeRow['collaborators'];
  acknowledgments?: string | null;
  funding?: string | null;
  resources?: ResearchThemeResourceInput[] | null;
};

export type UpdateResearchThemeInput = Partial<CreateResearchThemeInput>;

export type ListAdminResearchQuery = {
  q?: string;
  publishStatus?: PublishStatus;
  themeStatus?: ResearchThemeStatus;
  featured?: boolean;
};
