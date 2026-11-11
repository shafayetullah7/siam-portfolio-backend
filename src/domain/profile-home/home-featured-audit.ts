import { and, eq, ne } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { projects } from '../../db/schema/projects';
import { publications } from '../../db/schema/publications';
import { researchThemes } from '../../db/schema/research';

export type UnpublishedFeaturedAudit = {
  themeTitles: string[];
  publicationTitles: string[];
  projectTitles: string[];
};

const AUDIT_LIMIT = 20;

export async function listUnpublishedFeaturedOnHome(
  db: NodePgDatabase,
): Promise<UnpublishedFeaturedAudit> {
  const notPublished = ne(researchThemes.publishStatus, 'published');

  const [themes, pubs, projs] = await Promise.all([
    db
      .select({ title: researchThemes.title })
      .from(researchThemes)
      .where(and(eq(researchThemes.featuredOnHome, true), notPublished))
      .limit(AUDIT_LIMIT),
    db
      .select({ title: publications.title })
      .from(publications)
      .where(
        and(eq(publications.featuredOnHome, true), ne(publications.publishStatus, 'published')),
      )
      .limit(AUDIT_LIMIT),
    db
      .select({ title: projects.title })
      .from(projects)
      .where(
        and(eq(projects.featuredOnHome, true), ne(projects.publishStatus, 'published')),
      )
      .limit(AUDIT_LIMIT),
  ]);

  return {
    themeTitles: themes.map((r) => r.title),
    publicationTitles: pubs.map((r) => r.title),
    projectTitles: projs.map((r) => r.title),
  };
}
