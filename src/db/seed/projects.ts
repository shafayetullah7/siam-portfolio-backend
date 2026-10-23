/**
 * Local/dev only — seeds projects from projects.catalog.ts.
 */
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { projectMetrics } from '../schema/project-metrics';
import { projectPublications } from '../schema/project-publications';
import { projectResources } from '../schema/project-resources';
import { projectSections } from '../schema/project-sections';
import { projects } from '../schema/projects';
import { publications } from '../schema/publications';
import { researchThemeProjects, researchThemes } from '../schema/research';
import { projectsCatalog, type ProjectSeedEntry } from './projects.catalog';

async function linkProjectToTheme(
  db: NodePgDatabase,
  themeSlug: string,
  projectId: string,
): Promise<void> {
  const [theme] = await db
    .select({ id: researchThemes.id })
    .from(researchThemes)
    .where(eq(researchThemes.slug, themeSlug))
    .limit(1);
  if (!theme) return;

  const [existing] = await db
    .select({ id: researchThemeProjects.id })
    .from(researchThemeProjects)
    .where(eq(researchThemeProjects.projectId, projectId))
    .limit(1);
  if (existing) return;

  await db.insert(researchThemeProjects).values({
    themeId: theme.id,
    projectId,
    sortOrder: 0,
  });
}

async function linkProjectToPublications(
  db: NodePgDatabase,
  projectId: string,
  publicationSlugs: readonly string[],
): Promise<void> {
  for (let index = 0; index < publicationSlugs.length; index += 1) {
    const slug = publicationSlugs[index];
    const [pub] = await db
      .select({ id: publications.id })
      .from(publications)
      .where(eq(publications.slug, slug))
      .limit(1);
    if (!pub) continue;

    const [existing] = await db
      .select({ id: projectPublications.id })
      .from(projectPublications)
      .where(eq(projectPublications.publicationId, pub.id))
      .limit(1);
    if (existing) continue;

    await db.insert(projectPublications).values({
      projectId,
      publicationId: pub.id,
      sortOrder: index,
    });
  }
}

async function insertChildren(
  db: NodePgDatabase,
  projectId: string,
  entry: ProjectSeedEntry,
): Promise<void> {
  const sections = entry.sections ?? [];
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    await db.insert(projectSections).values({
      projectId,
      sortOrder: index,
      kind: section.kind,
      ...(section.title ? { title: section.title } : {}),
      body: section.body,
    });
  }

  const resources = entry.resources ?? [];
  for (let index = 0; index < resources.length; index += 1) {
    const resource = resources[index];
    await db.insert(projectResources).values({
      projectId,
      sortOrder: index,
      label: resource.label,
      url: resource.url,
      resourceType: resource.resourceType ?? 'other',
    });
  }

  const metrics = entry.metrics ?? [];
  for (let index = 0; index < metrics.length; index += 1) {
    const metric = metrics[index];
    await db.insert(projectMetrics).values({
      projectId,
      sortOrder: index,
      name: metric.name,
      value: metric.value,
      ...(metric.unit ? { unit: metric.unit } : {}),
      ...(metric.notes ? { notes: metric.notes } : {}),
    });
  }
}

export async function seedProjects(db: NodePgDatabase): Promise<void> {
  let inserted = 0;
  let skipped = 0;

  for (let sortOrder = 0; sortOrder < projectsCatalog.length; sortOrder += 1) {
    const entry = projectsCatalog[sortOrder];
    const [existing] = await db
      .select({ slug: projects.slug })
      .from(projects)
      .where(eq(projects.slug, entry.slug))
      .limit(1);

    if (existing) {
      skipped += 1;
      continue;
    }

    const publishStatus = entry.publishStatus ?? 'draft';
    const publishedAt = publishStatus === 'published' ? new Date() : null;
    const tags = entry.tags ? [...entry.tags] : null;

    const [row] = await db
      .insert(projects)
      .values({
        slug: entry.slug,
        title: entry.title,
        summary: entry.summary,
        tags,
        projectType: entry.projectType ?? 'other',
        projectStatus: entry.projectStatus ?? 'completed',
        evaluationMaturity: entry.evaluationMaturity ?? 'provisional',
        ...(entry.ownerRole ? { ownerRole: entry.ownerRole } : {}),
        ...(entry.ownerContribution
          ? { ownerContribution: entry.ownerContribution }
          : {}),
        ...(entry.resultTeaser ? { resultTeaser: entry.resultTeaser } : {}),
        featured: entry.featured ?? false,
        featuredOnHome: entry.featuredOnHome ?? false,
        sortOrder,
        publishStatus,
        publishedAt,
      })
      .returning({ id: projects.id });

    await insertChildren(db, row.id, entry);

    if (entry.linkThemeSlug && publishStatus === 'published') {
      await linkProjectToTheme(db, entry.linkThemeSlug, row.id);
    }
    if (entry.linkPublicationSlugs?.length && publishStatus === 'published') {
      await linkProjectToPublications(db, row.id, entry.linkPublicationSlugs);
    }

    inserted += 1;
  }

  if (inserted > 0) {
    console.log(
      `Seeded ${inserted} project(s) (${skipped} already existed). Drafts publish via /admin/projects.`,
    );
  } else if (skipped > 0) {
    console.log(`Projects seed skipped — ${skipped} slug(s) already exist.`);
  }
}
