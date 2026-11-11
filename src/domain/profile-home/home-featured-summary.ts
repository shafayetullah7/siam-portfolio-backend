import { and, asc, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { isPubliclyVisible } from '../../common/publishing/is-publicly-visible';
import type { PublishStatus } from '../../common/publishing/publish-status';
import { projects } from '../../db/schema/projects';
import { publications } from '../../db/schema/publications';
import { researchThemes } from '../../db/schema/research';
import { FEATURED_ON_HOME_CAPS } from './featured-on-home.constants';
import type {
  HomeFeaturedKind,
  HomeFeaturedSummaryItem,
  HomeFeaturedSummaryResponse,
} from './home-featured-summary.types';

function mapItem(
  kind: HomeFeaturedKind,
  row: { id: string; slug: string; title: string; publishStatus: string; scheduledAt: Date | null },
  now: Date,
): HomeFeaturedSummaryItem {
  const publishStatus = row.publishStatus;
  const appearsOnPublicHome = isPubliclyVisible(
    publishStatus as PublishStatus,
    row.scheduledAt,
    now,
  );
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    publishStatus,
    kind,
    appearsOnPublicHome,
  };
}

export async function getHomeFeaturedSummary(
  db: NodePgDatabase,
  now = new Date(),
): Promise<HomeFeaturedSummaryResponse> {
  const [themes, pubs, projs] = await Promise.all([
    db
      .select({
        id: researchThemes.id,
        slug: researchThemes.slug,
        title: researchThemes.title,
        publishStatus: researchThemes.publishStatus,
        scheduledAt: researchThemes.scheduledAt,
      })
      .from(researchThemes)
      .where(eq(researchThemes.featuredOnHome, true))
      .orderBy(asc(researchThemes.sortOrder), asc(researchThemes.title)),
    db
      .select({
        id: publications.id,
        slug: publications.slug,
        title: publications.title,
        publishStatus: publications.publishStatus,
        scheduledAt: publications.scheduledAt,
      })
      .from(publications)
      .where(eq(publications.featuredOnHome, true))
      .orderBy(desc(publications.year), asc(publications.title)),
    db
      .select({
        id: projects.id,
        slug: projects.slug,
        title: projects.title,
        publishStatus: projects.publishStatus,
        scheduledAt: projects.scheduledAt,
      })
      .from(projects)
      .where(eq(projects.featuredOnHome, true))
      .orderBy(asc(projects.sortOrder), asc(projects.title)),
  ]);

  return {
    caps: FEATURED_ON_HOME_CAPS,
    research: themes.map((r) => mapItem('research', r, now)),
    publications: pubs.map((r) => mapItem('publication', r, now)),
    projects: projs.map((r) => mapItem('project', r, now)),
  };
}
