import { describe, expect, it } from 'vitest';
import { articlePublishChecklist } from './article-publish-checklist';
import { articleRow } from './writing.test-helpers';

function longBody(wordCount: number): string {
  return Array.from({ length: wordCount }, (_, i) => `word${i}`).join(' ');
}

describe('articlePublishChecklist', () => {
  it('requires cover alt when cover is set', () => {
    const result = articlePublishChecklist(
      articleRow({ coverMediaId: 'media-1' }),
      { coverAlt: '   ', coverMediaMissing: false },
    );
    expect(result.errors.some((e) => e.code === 'cover_alt_required')).toBe(
      true,
    );
  });

  it('blocks body under 100 words', () => {
    const result = articlePublishChecklist(
      articleRow({ body: longBody(50) }),
      {},
    );
    expect(result.errors.some((e) => e.code === 'body_too_short')).toBe(true);
  });

  it('warns on http links in body', () => {
    const result = articlePublishChecklist(
      articleRow({ body: `${longBody(100)} See http://example.com` }),
      {},
    );
    expect(result.warnings.some((w) => w.code === 'http_links_in_body')).toBe(
      true,
    );
  });

  it('warns on unbalanced display math delimiters', () => {
    const result = articlePublishChecklist(
      articleRow({ body: `${longBody(100)} $$\n x^2` }),
      {},
    );
    expect(
      result.warnings.some((w) => w.code === 'math_delimiters_unbalanced'),
    ).toBe(true);
  });

  it('warns when tags are missing', () => {
    const result = articlePublishChecklist(
      articleRow({ body: longBody(100), tags: null }),
      {},
    );
    expect(result.warnings.some((w) => w.code === 'tags_missing')).toBe(true);
  });
});
