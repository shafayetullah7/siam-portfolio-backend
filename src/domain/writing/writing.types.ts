import type { PublishStatus } from '../../common/publishing/publish-status';
import type { articles } from '../../db/schema/writing/articles';
import type { writingSeries } from '../../db/schema/writing/writing-series';

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
  articles: [];
  publications: [];
  projects: [];
  themes: [];
};

export type WritingPublicDetail = WritingPublicCard & {
  subtitle?: string | null;
  body: string;
  byline?: string | null;
  related: WritingPublicRelated;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type PublishArticleOptions = {
  confirmWarnings?: boolean;
};

export type ListPublishedPublicWritingQuery = {
  q?: string;
  tag?: string;
  page?: number;
  limit?: number;
  featuredOnHub?: boolean;
  excludeFeaturedOnHub?: boolean;
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
