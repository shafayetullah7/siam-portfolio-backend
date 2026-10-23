import { describe, expect, it } from 'vitest';
import {
  articlePublishChecklist,
  displayMathDelimitersBalanced,
  markdownFencesBalanced,
} from '../../domain/writing/article-publish-checklist';
import { articleRow } from '../../domain/writing/writing.test-helpers';
import { showcaseArticleBody, writingArticlesCatalog } from './writing.catalog';

describe('writing.catalog', () => {
  it('showcase body passes publish checklist and delimiter checks', () => {
    const showcase = writingArticlesCatalog.find((e) => e.useSeedCover);
    expect(showcase).toBeDefined();
    const body = showcaseArticleBody();
    expect(markdownFencesBalanced(body)).toBe(true);
    expect(displayMathDelimitersBalanced(body)).toBe(true);
    const row = articleRow({
      slug: showcase!.slug,
      title: showcase!.title,
      summary: showcase!.summary,
      body,
      tags: [...(showcase!.tags ?? [])],
      coverMediaId: 'cover-id',
    });
    const result = articlePublishChecklist(row, {
      coverAlt: 'Seed cover alt',
      coverMediaMissing: false,
    });
    expect(result.errors).toHaveLength(0);
  });
});
