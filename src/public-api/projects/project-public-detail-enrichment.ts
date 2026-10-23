import type { PublicationsService } from '../../domain/publications/publications.service';
import type { ProjectsService } from '../../domain/projects/projects.service';
import type { ResearchService } from '../../domain/research/research.service';
import type {
  ProjectPublicDetail,
  ProjectPublicDetailEnriched,
  ProjectRow,
} from '../../domain/projects/projects.types';

type CoverResolved = { url: string; alt: string | null } | null;

export async function enrichProjectPublicDetail(
  projects: ProjectsService,
  publications: PublicationsService,
  research: ResearchService,
  row: ProjectRow,
  detail: ProjectPublicDetail,
  options: {
    cover?: CoverResolved;
    prevSlug?: string;
    nextSlug?: string;
  } = {},
): Promise<ProjectPublicDetailEnriched> {
  const [sectionRows, publicationIds, themeIds] = await Promise.all([
    projects.loadSectionsForProject(row.id),
    projects.listPublicationIdsForProject(row.id),
    projects.listThemeIdsForProject(row.id),
  ]);

  const sectionIds = sectionRows.map((s) => s.id);
  const mediaBySection = await projects.loadSectionMediaIdsBySectionIds(sectionIds);
  const allMediaIds = [
    ...new Set(sectionIds.flatMap((id) => mediaBySection.get(id) ?? [])),
  ];
  const mediaRows = allMediaIds.length
    ? await projects.loadMediaByIds(allMediaIds)
    : new Map<string, { url: string; alt: string | null }>();

  const sectionsWithFigures = projects.attachSectionFiguresToPublicSections(
    sectionRows,
    detail.sections,
    mediaBySection,
    mediaRows,
  );

  const [publicationCards, themeCards] = await Promise.all([
    publications.listPublishedCardsByIds(publicationIds),
    research.listPublishedThemeCardsByIds(themeIds),
  ]);

  const related =
    publicationCards.length > 0 || themeCards.length > 0
      ? {
          publications: publicationCards,
          themes: themeCards,
        }
      : undefined;

  return {
    ...detail,
    sections: sectionsWithFigures,
    ...(options.cover ? { cover: options.cover } : {}),
    ...(options.prevSlug ? { prevSlug: options.prevSlug } : {}),
    ...(options.nextSlug ? { nextSlug: options.nextSlug } : {}),
    ...(related ? { related } : {}),
  };
}
