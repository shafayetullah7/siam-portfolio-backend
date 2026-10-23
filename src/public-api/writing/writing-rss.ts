import { createHash } from 'node:crypto';
import type { ArticleRow } from '../../domain/writing/writing.types';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripMarkdownForRss(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type WritingRssBuildInput = {
  siteTitle: string;
  siteOrigin: string;
  hubPath: string;
  items: ArticleRow[];
};

export type WritingRssBuildResult = {
  xml: string;
  etag: string;
};

export function buildWritingRssFeed(input: WritingRssBuildInput): WritingRssBuildResult {
  const hubUrl = `${input.siteOrigin}${input.hubPath}`;
  const latest = input.items[0]?.publishedAt?.toISOString() ?? '';
  const etagSource = `${input.items.length}:${latest}`;
  const etag = `"${createHash('sha256').update(etagSource).digest('hex')}"`;

  const channelItems = input.items
    .map((row) => {
      const link = `${input.siteOrigin}/writing/${row.slug}`;
      const description = escapeXml(
        stripMarkdownForRss(row.summary || row.body.slice(0, 500)),
      );
      const pubDate = row.publishedAt
        ? row.publishedAt.toUTCString()
        : row.updatedAt.toUTCString();
      return `
    <item>
      <title>${escapeXml(row.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(input.siteTitle)} — Writing</title>
    <link>${escapeXml(hubUrl)}</link>
    <description>${escapeXml(`Articles from ${input.siteTitle}`)}</description>
    <language>en</language>${channelItems}
  </channel>
</rss>`;

  return { xml, etag };
}
