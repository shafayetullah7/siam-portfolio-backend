import { describe, expect, it } from 'vitest';
import { articleRow } from '../../domain/writing/writing.test-helpers';
import { buildWritingRssFeed } from './writing-rss';

describe('buildWritingRssFeed', () => {
  it('emits RSS 2.0 with stable etag', () => {
    const row = articleRow({
      slug: 'hello',
      title: 'Hello',
      summary: 'Summary text',
      publishStatus: 'published',
      publishedAt: new Date('2024-02-01T12:00:00Z'),
    });
    const first = buildWritingRssFeed({
      siteTitle: 'SIAM',
      siteOrigin: 'http://localhost:5001',
      hubPath: '/writing',
      items: [row],
    });
    expect(first.xml).toContain('<rss version="2.0">');
    expect(first.xml).toContain('Hello');
    expect(first.xml).toContain('http://localhost:5001/writing/hello');
    const second = buildWritingRssFeed({
      siteTitle: 'SIAM',
      siteOrigin: 'http://localhost:5001',
      hubPath: '/writing',
      items: [row],
    });
    expect(second.etag).toBe(first.etag);
  });
});
