/**
 * Dev seed source for writing articles. Tone aligns with
 * docs/content-packet/editorial.md (restrained, academic).
 */

export type WritingSeriesSeed = {
  slug: string;
  title: string;
  summary?: string;
  sortOrder?: number;
};

export type WritingArticleSeedEntry = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  tags?: readonly string[];
  subtitle?: string;
  publishStatus?: 'draft' | 'published' | 'scheduled';
  /** When publishStatus is scheduled, ISO date in the future (seed sets scheduledAt). */
  scheduledAtIso?: string;
  featuredOnHub?: boolean;
  seriesSlug?: string;
  seriesSortOrder?: number;
  /** Showcase only: attach dev cover media with alt text. */
  useSeedCover?: boolean;
  linkPublicationSlug?: string;
  linkProjectSlug?: string;
  linkThemeSlug?: string;
  relatedArticleSlug?: string;
};

export const writingSeriesCatalog: readonly WritingSeriesSeed[] = [
  {
    slug: 'methods-notes',
    title: 'Methods notes',
    summary:
      'Short essays on reproducibility, evaluation, and writing for technical audiences.',
    sortOrder: 0,
  },
];

function paragraphWords(prefix: string, count: number): string {
  return Array.from({ length: count }, (_, i) => `${prefix}${i}`).join(' ');
}

/** Body with code fence, display math, and enough words to publish. */
export function showcaseArticleBody(): string {
  const intro = paragraphWords('word', 55);
  const outro = paragraphWords('term', 50);
  return `## Why reproducibility matters

${intro}

We can express a simple linear model as:

$$
\\hat{y} = \\mathbf{w}^\\top \\mathbf{x} + b
$$

The training loop might look like this:

\`\`\`python
def train_step(model, batch, optimizer):
    loss = model.loss(batch)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    return float(loss)
\`\`\`

### Checklist before sharing

${outro}

Keep claims tied to artifacts readers can verify.
`;
}

export const writingArticlesCatalog: readonly WritingArticleSeedEntry[] = [
  {
    slug: 'writing-showcase-dev',
    title: 'Reproducibility notes (dev showcase)',
    subtitle: 'Placeholder essay for local CMS smoke tests',
    summary:
      'A seeded article with code, math, and cover alt text for WRIT12 verification. Replace with approved editorial copy.',
    body: showcaseArticleBody(),
    tags: ['reproducibility', 'methods', 'essay'],
    publishStatus: 'published',
    featuredOnHub: true,
    useSeedCover: true,
    linkPublicationSlug: 'example-publication-neurips-2025',
    linkProjectSlug: 'example-open-source-project',
    linkThemeSlug: 'interpretable-representation-learning',
    relatedArticleSlug: 'methods-notes-part-two',
  },
  {
    slug: 'methods-notes-part-one',
    title: 'Methods notes — evaluation hygiene',
    summary:
      'Holdout leakage and reporting baselines: a short note for the methods-notes series.',
    body: `${paragraphWords('eval', 110)}\n\n## Baselines\n\nReport confidence intervals when comparing systems.`,
    tags: ['evaluation', 'methods'],
    publishStatus: 'published',
    seriesSlug: 'methods-notes',
    seriesSortOrder: 0,
  },
  {
    slug: 'methods-notes-part-two',
    title: 'Methods notes — documenting ablations',
    summary:
      'How to structure ablation tables so readers can reproduce comparisons.',
    body: `${paragraphWords('ablation', 110)}\n\n## Tables\n\nPrefer fixed seeds and version pins in appendix links.`,
    tags: ['documentation', 'methods'],
    publishStatus: 'published',
    seriesSlug: 'methods-notes',
    seriesSortOrder: 1,
  },
  {
    slug: 'writing-draft-placeholder',
    title: 'Draft essay (not public)',
    summary: 'Stays in draft for admin list smoke tests.',
    body: paragraphWords('draft', 105),
    tags: ['draft'],
    publishStatus: 'draft',
  },
  {
    slug: 'writing-scheduled-placeholder',
    title: 'Scheduled essay (future)',
    summary: 'Scheduled row for lifecycle UI; not visible on public site until due.',
    body: paragraphWords('future', 105),
    tags: ['scheduled'],
    publishStatus: 'scheduled',
    scheduledAtIso: '2099-06-01T12:00:00.000Z',
  },
];
