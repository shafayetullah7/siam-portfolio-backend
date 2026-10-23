import type { PublishStatus } from '../../common/publishing/publish-status';
import type { articles } from '../../db/schema/writing/articles';
import type { writingSeries } from '../../db/schema/writing/writing-series';
import type { ProjectPublicCard } from '../projects/projects.types';
import type { PublicationPublicCard } from '../publications/publications.types';
import type { ResearchThemePublicLinkCard } from '../research/research.types';

export type ArticleRow = typeof articles.$inferSelect;
export type WritingSeriesRow = typeof writingSeries.$inferSelect;

export type CreateArticleInput = {
  slug: string;
  title: string;
  summary: string;
  subtitle?: string | null;
  body?: string;
  tags?: string[] | null;
  seriesId?: string | null;
  seriesSortOrder?: number | null;
  coverMediaId?: string | null;
  byline?: string | null;
  featuredOnHub?: boolean;
  featured?: boolean;
  sortOrder?: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  hideFromSearch?: boolean;
};

export type UpdateArticleInput = Partial<CreateArticleInput>;

export type WritingPublicCard = {
  slug: string;
  title: string;
  summary: string;
  href: string;
  tags?: string[];
  readingTimeMinutes?: number | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  materiallyUpdatedAt?: string | null;
  featuredOnHub?: boolean;
  coverUrl?: string | null;
  coverAlt?: string | null;
};

export type WritingPublicRelated = {
  articles: WritingPublicCard[];
  publications: PublicationPublicCard[];
  projects: ProjectPublicCard[];
  themes: ResearchThemePublicLinkCard[];
};

export type ArticleRelations = {
  publicationIds: string[];
  projectIds: string[];
  themeIds: string[];
  relatedArticleIds: string[];
};

export type ReplaceArticleRelationsInput = {
  publicationIds?: string[];
  projectIds?: string[];
  themeIds?: string[];
  relatedArticleIds?: string[];
};

export type WritingPublicDetail = WritingPublicCard & {
  subtitle?: string | null;
  body: string;
  wordCount?: number | null;
  byline?: string | null;
  related: WritingPublicRelated;
  seoTitle?: string | null;
  seoDescription?: string | null;
  prevSlug?: string;
  nextSlug?: string;
  seriesPrevSlug?: string;
  seriesNextSlug?: string;
  series?: { slug: string; title: string };
};

export type PublishArticleOptions = {
  confirmWarnings?: boolean;
};

export type ListPublishedPublicWritingSort =
  | 'publishedAtDesc'
  | 'titleAsc';

export type ListPublishedPublicWritingQuery = {
  q?: string;
  tag?: string;
  seriesSlug?: string;
  sort?: ListPublishedPublicWritingSort;
  page?: number;
  limit?: number;
  featuredOnHub?: boolean;
  excludeFeaturedOnHub?: boolean;
};

export type PublishedWritingSeriesSection = {
  series: WritingSeriesRow;
  articles: ArticleRow[];
};

export type ListAdminArticlesSort =
  | 'updatedAtDesc'
  | 'titleAsc'
  | 'publishedAtDesc';

export type ListAdminArticlesQuery = {
  q?: string;
  publishStatus?: PublishStatus;
  tag?: string;
  seriesId?: string;
  page?: number;
  limit?: number;
  sort?: ListAdminArticlesSort;
};
