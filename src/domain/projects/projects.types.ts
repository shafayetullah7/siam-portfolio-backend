import type { PublishStatus } from '../../common/publishing/publish-status';
import type { PublicationPublicCard } from '../publications/publications.types';
import type {
  ProjectMetricWrite,
  ProjectResourceWrite,
  ProjectSectionWrite,
} from './project-child-inputs';
import type { projectMetrics } from '../../db/schema/project-metrics';
import type { projectResources } from '../../db/schema/project-resources';
import type { projectSections } from '../../db/schema/project-sections';
import type { projects } from '../../db/schema/projects';

export type ProjectRow = typeof projects.$inferSelect;

export type ProjectSectionRow = typeof projectSections.$inferSelect;
export type ProjectResourceRow = typeof projectResources.$inferSelect;
export type ProjectMetricRow = typeof projectMetrics.$inferSelect;

export type ProjectType =
  | 'research_prototype'
  | 'production'
  | 'open_source'
  | 'coursework'
  | 'competition'
  | 'other';

export type ProjectStatus =
  | 'ongoing'
  | 'completed'
  | 'maintained'
  | 'archived';

export type EvaluationMaturity = 'verified' | 'provisional' | 'experimental';

export type ProjectResourceType =
  | 'repo'
  | 'demo'
  | 'paper'
  | 'dataset'
  | 'model_card'
  | 'documentation'
  | 'video'
  | 'other';

export type ProjectSectionKind =
  | 'problem'
  | 'context'
  | 'responsibilities'
  | 'solution'
  | 'data_methods'
  | 'evaluation'
  | 'results'
  | 'limitations'
  | 'future_work'
  | 'custom';

export type ListAdminProjectsQuery = {
  q?: string;
  publishStatus?: PublishStatus;
  projectType?: ProjectType;
  featured?: boolean;
  limit?: number;
};

export type ListPublishedPublicProjectsQuery = {
  q?: string;
  tag?: string;
  projectType?: ProjectType;
  projectStatus?: ProjectStatus;
  featured?: boolean;
  excludeFeatured?: boolean;
  page?: number;
  limit?: number;
};

export type PublishProjectOptions = {
  confirmWarnings?: boolean;
};

export type CreateProjectInput = {
  slug: string;
  title: string;
  summary: string;
  tags?: string[] | null;
  projectType?: ProjectType;
  projectStatus?: ProjectStatus;
  evaluationMaturity?: EvaluationMaturity;
  ownerRole?: string | null;
  ownerContribution?: string | null;
  resultTeaser?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  coverMediaId?: string | null;
  featured?: boolean;
  featuredOnHome?: boolean;
  sortOrder?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  hideFromSearch?: boolean;
  sections?: ProjectSectionWrite[];
  resources?: ProjectResourceWrite[];
  metrics?: ProjectMetricWrite[];
};

export type UpdateProjectInput = Partial<CreateProjectInput>;

export type {
  ProjectMetricWrite,
  ProjectResourceWrite,
  ProjectSectionWrite,
} from './project-child-inputs';

export type ProjectPrimaryResource = {
  label: string;
  url: string;
  resourceType: ProjectResourceType;
};

export type ProjectPublicCard = {
  slug: string;
  title: string;
  summary: string;
  tags?: string[];
  href: string;
  projectType: ProjectType;
  projectStatus: ProjectStatus;
  ownerContribution?: string;
  resultTeaser?: string;
  featured?: boolean;
  primaryResource?: ProjectPrimaryResource;
  coverUrl?: string | null;
  coverAlt?: string | null;
};

export type ProjectPublicSectionFigure = {
  url: string;
  alt: string | null;
  caption?: string | null;
};

export type ProjectPublicSection = {
  kind: ProjectSectionKind;
  title?: string;
  body: string;
  sortOrder: number;
  figures?: ProjectPublicSectionFigure[];
};

export type ProjectRelatedThemeCard = {
  slug: string;
  title: string;
  summary: string;
  href: string;
};

export type ProjectPublicRelated = {
  themes: ProjectRelatedThemeCard[];
  publications: PublicationPublicCard[];
};

export type ProjectPublicResource = {
  resourceType: ProjectResourceType;
  label: string;
  url: string;
  sortOrder: number;
};

export type ProjectPublicMetric = {
  name: string;
  value: string;
  unit?: string;
  baseline?: string;
  notes?: string;
  caption?: string;
  sortOrder: number;
};

export type ProjectPublicDetail = {
  slug: string;
  title: string;
  summary: string;
  href: string;
  tags?: string[];
  projectType: ProjectType;
  projectStatus: ProjectStatus;
  evaluationMaturity: EvaluationMaturity;
  ownerRole?: string;
  ownerContribution?: string;
  resultTeaser?: string;
  periodStart?: string;
  periodEnd?: string;
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  sections: ProjectPublicSection[];
  resources: ProjectPublicResource[];
  metrics: ProjectPublicMetric[];
};

export type ProjectPublicDetailEnriched = ProjectPublicDetail & {
  cover?: { url: string; alt: string | null };
  prevSlug?: string;
  nextSlug?: string;
  related?: ProjectPublicRelated;
};
