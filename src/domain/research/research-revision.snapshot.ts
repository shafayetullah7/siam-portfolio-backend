import type { PublishStatus } from '../../common/publishing/publish-status';
import { researchThemes } from '../../db/schema/research';
import type {
  ResearchThemeResourceInput,
  ResearchThemeRow,
} from './research.types';

export const RESEARCH_THEME_ENTITY_TYPE = 'research_theme';

export type ResearchThemeRevisionSnapshot = {
  slug: string;
  title: string;
  summary: string;
  themeStatus: ResearchThemeRow['themeStatus'];
  problem: string;
  significance: string | null;
  objectives: string | null;
  approach: string | null;
  findings: string | null;
  limitations: string | null;
  futureWork: string | null;
  tags: string[] | null;
  linkLabel: string | null;
  coverMediaId: string | null;
  sortOrder: number;
  featuredOnHome: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  collaborators: ResearchThemeRow['collaborators'];
  acknowledgments: string | null;
  funding: string | null;
  resources: ResearchThemeResourceInput[];
  publicationIds: string[];
  projectIds: string[];
  publishStatus: PublishStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  archivedAt: string | null;
};

export function researchThemeToSnapshot(
  row: ResearchThemeRow,
  resources: ResearchThemeResourceInput[] = [],
  publicationIds: string[] = [],
  projectIds: string[] = [],
): ResearchThemeRevisionSnapshot {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    themeStatus: row.themeStatus,
    problem: row.problem,
    significance: row.significance,
    objectives: row.objectives,
    approach: row.approach,
    findings: row.findings,
    limitations: row.limitations,
    futureWork: row.futureWork,
    tags: row.tags,
    linkLabel: row.linkLabel,
    coverMediaId: row.coverMediaId,
    sortOrder: row.sortOrder,
    featuredOnHome: row.featuredOnHome,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    collaborators: row.collaborators,
    acknowledgments: row.acknowledgments,
    funding: row.funding,
    resources,
    publicationIds,
    projectIds,
    publishStatus: row.publishStatus as PublishStatus,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}

function parseSnapshotDate(value: string | null | undefined): Date | null {
  if (value == null) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function snapshotToResearchThemePatch(
  snap: Partial<ResearchThemeRevisionSnapshot>,
  current: ResearchThemeRow,
): Partial<typeof researchThemes.$inferInsert> {
  return {
    slug: snap.slug ?? current.slug,
    title: snap.title ?? current.title,
    summary: snap.summary ?? current.summary,
    themeStatus: snap.themeStatus ?? current.themeStatus,
    problem: snap.problem ?? current.problem,
    significance: snap.significance ?? current.significance,
    objectives: snap.objectives ?? current.objectives,
    approach: snap.approach ?? current.approach,
    findings: snap.findings ?? current.findings,
    limitations: snap.limitations ?? current.limitations,
    futureWork: snap.futureWork ?? current.futureWork,
    tags: snap.tags ?? current.tags,
    linkLabel: snap.linkLabel ?? current.linkLabel,
    coverMediaId: snap.coverMediaId ?? current.coverMediaId,
    sortOrder: snap.sortOrder ?? current.sortOrder,
    featuredOnHome: snap.featuredOnHome ?? current.featuredOnHome,
    seoTitle: snap.seoTitle ?? current.seoTitle,
    seoDescription: snap.seoDescription ?? current.seoDescription,
    collaborators: snap.collaborators ?? current.collaborators,
    acknowledgments: snap.acknowledgments ?? current.acknowledgments,
    funding: snap.funding ?? current.funding,
    publishStatus: snap.publishStatus ?? current.publishStatus,
    publishedAt:
      snap.publishedAt !== undefined
        ? parseSnapshotDate(snap.publishedAt)
        : current.publishedAt,
    scheduledAt:
      snap.scheduledAt !== undefined
        ? parseSnapshotDate(snap.scheduledAt)
        : current.scheduledAt,
    archivedAt:
      snap.archivedAt !== undefined
        ? parseSnapshotDate(snap.archivedAt)
        : current.archivedAt,
  };
}
