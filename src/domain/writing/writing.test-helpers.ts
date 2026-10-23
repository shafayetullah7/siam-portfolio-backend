import type { ArticleRow } from './writing.types';

export function articleRow(overrides: Partial<ArticleRow> = {}): ArticleRow {
  const now = new Date();
  return {
    id: 'art-1',
    slug: 'my-article',
    title: 'My Article',
    subtitle: null,
    summary: 'Summary text',
    body: 'Hello world',
    tags: null,
    seriesId: null,
    seriesSortOrder: null,
    coverMediaId: null,
    byline: null,
    readingTimeMinutes: 1,
    wordCount: 2,
    featuredOnHub: false,
    featured: false,
    sortOrder: 0,
    materiallyUpdatedAt: null,
    seoTitle: null,
    seoDescription: null,
    hideFromSearch: false,
    publishStatus: 'draft',
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
