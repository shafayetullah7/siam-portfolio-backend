import type { ArticleRow } from './writing.types';
import { countWords, readingTimeMinutes } from './writing-reading-stats';

export type PublishChecklistItem = {
  code: string;
  message: string;
};

export type ArticlePublishChecklistContext = {
  coverAlt?: string | null;
  coverMediaMissing?: boolean;
};

export type ArticlePublishChecklistResult = {
  errors: PublishChecklistItem[];
  warnings: PublishChecklistItem[];
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_PUBLISH_WORDS = 100;
const SHORT_READ_MINUTES = 2;

function isEmpty(value: string | null | undefined): boolean {
  return !value?.trim();
}

export function markdownFencesBalanced(body: string): boolean {
  const matches = body.match(/```/g);
  if (!matches) return true;
  return matches.length % 2 === 0;
}

export function displayMathDelimitersBalanced(body: string): boolean {
  const matches = body.match(/\$\$/g);
  if (!matches) return true;
  return matches.length % 2 === 0;
}

export function bodyContainsHttpLinks(body: string): boolean {
  return /http:\/\//i.test(body);
}

export function articlePublishChecklist(
  row: ArticleRow,
  context: ArticlePublishChecklistContext = {},
): ArticlePublishChecklistResult {
  const errors: PublishChecklistItem[] = [];
  const warnings: PublishChecklistItem[] = [];

  if (isEmpty(row.title)) {
    errors.push({ code: 'title_required', message: 'Title is required' });
  }
  const slug = row.slug.trim();
  if (!slug) {
    errors.push({ code: 'slug_required', message: 'Slug is required' });
  } else if (!SLUG_PATTERN.test(slug)) {
    errors.push({
      code: 'slug_invalid',
      message: 'Slug must use lowercase letters, numbers, and hyphens only',
    });
  }
  if (isEmpty(row.summary)) {
    errors.push({ code: 'summary_required', message: 'Summary is required' });
  }

  const body = row.body ?? '';
  if (isEmpty(body)) {
    errors.push({ code: 'body_required', message: 'Body is required' });
  } else {
    const wordCount = countWords(body);
    if (wordCount < MIN_PUBLISH_WORDS) {
      errors.push({
        code: 'body_too_short',
        message: `Body must be at least ${MIN_PUBLISH_WORDS} words before publishing`,
      });
    }
    if (!markdownFencesBalanced(body)) {
      errors.push({
        code: 'markdown_invalid',
        message: 'Body has unclosed Markdown code fences (```)',
      });
    }
    if (!displayMathDelimitersBalanced(body)) {
      warnings.push({
        code: 'math_delimiters_unbalanced',
        message:
          'Body has an odd number of $$ display-math delimiters. Check math blocks.',
      });
    }
  }

  if (row.coverMediaId) {
    if (context.coverMediaMissing) {
      errors.push({
        code: 'cover_media_missing',
        message: 'Cover image media record was not found',
      });
    } else if (isEmpty(context.coverAlt)) {
      errors.push({
        code: 'cover_alt_required',
        message: 'Cover image must have alt text in the media library',
      });
    }
  }

  const tags = row.tags ?? [];
  if (tags.length === 0) {
    warnings.push({
      code: 'tags_missing',
      message: 'No tags are set. Consider adding tags for discovery.',
    });
  }

  const readMinutes =
    row.readingTimeMinutes ??
    readingTimeMinutes(countWords(body));
  if (readMinutes < SHORT_READ_MINUTES) {
    warnings.push({
      code: 'body_short_read',
      message: `Estimated reading time is under ${SHORT_READ_MINUTES} minutes.`,
    });
  }

  if (bodyContainsHttpLinks(body)) {
    warnings.push({
      code: 'http_links_in_body',
      message: 'Body contains links using http://. Prefer https:// where possible.',
    });
  }

  if (
    row.materiallyUpdatedAt != null &&
    (row.publishStatus === 'draft' || row.publishStatus === 'scheduled')
  ) {
    warnings.push({
      code: 'republish_material_update',
      message:
        'This article was published before. Confirm this publish reflects a material update.',
    });
  }

  return { errors, warnings };
}
