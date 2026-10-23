import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { asc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { media } from '../../db/schema/media';
import { navItems, siteSettings } from '../../db/schema/site';
import { MEDIA_IMAGE_MIME_TYPES } from '../media/media-upload.constants';
import { ProjectsService } from '../projects/projects.service';
import { WritingService } from '../writing/writing.service';
import { PublicationsService } from '../publications/publications.service';
import { ResearchService } from '../research/research.service';
import { SitePagesService } from '../site-pages/site-pages.service';

@Injectable()
export class SiteService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
    private readonly sitePages: SitePagesService,
    private readonly research: ResearchService,
    private readonly publications: PublicationsService,
    private readonly projects: ProjectsService,
    private readonly writing: WritingService,
  ) {}

  async getOrCreateSettings() {
    const [existing] = await this.db.select().from(siteSettings).limit(1);
    if (existing) return existing;
    const [created] = await this.db
      .insert(siteSettings)
      .values({ siteName: 'SIAM' })
      .returning();
    return created;
  }

  async updateSettings(input: {
    siteName?: string;
    defaultMetaDescription?: string | null;
    footerText?: string | null;
    researchHubIntro?: string | null;
    projectsHubIntro?: string | null;
    writingHubIntro?: string | null;
    achievementsHubIntro?: string | null;
    experienceHubIntro?: string | null;
    faviconUrl?: string | null;
    faviconMediaId?: string | null;
  }) {
    const current = await this.getOrCreateSettings();
    const patch: Partial<typeof siteSettings.$inferInsert> = {};

    if (input.siteName !== undefined) patch.siteName = input.siteName;
    if (input.defaultMetaDescription !== undefined) {
      patch.defaultMetaDescription = input.defaultMetaDescription;
    }
    if (input.footerText !== undefined) patch.footerText = input.footerText;
    if (input.researchHubIntro !== undefined) {
      const trimmed = input.researchHubIntro?.trim() ?? '';
      patch.researchHubIntro = trimmed === '' ? null : trimmed;
    }
    if (input.projectsHubIntro !== undefined) {
      const trimmed = input.projectsHubIntro?.trim() ?? '';
      patch.projectsHubIntro = trimmed === '' ? null : trimmed;
    }
    if (input.writingHubIntro !== undefined) {
      const trimmed = input.writingHubIntro?.trim() ?? '';
      patch.writingHubIntro = trimmed === '' ? null : trimmed;
    }
    if (input.achievementsHubIntro !== undefined) {
      const trimmed = input.achievementsHubIntro?.trim() ?? '';
      patch.achievementsHubIntro = trimmed === '' ? null : trimmed;
    }
    if (input.experienceHubIntro !== undefined) {
      const trimmed = input.experienceHubIntro?.trim() ?? '';
      patch.experienceHubIntro = trimmed === '' ? null : trimmed;
    }

    // faviconMediaId wins over manual faviconUrl when both are sent.
    if (input.faviconMediaId !== undefined) {
      if (input.faviconMediaId === null) {
        patch.faviconMediaId = null;
        if (input.faviconUrl !== undefined) {
          patch.faviconUrl = input.faviconUrl;
        }
      } else {
        const [mediaRow] = await this.db
          .select()
          .from(media)
          .where(eq(media.id, input.faviconMediaId))
          .limit(1);
        if (!mediaRow) {
          throw new NotFoundException('Media not found');
        }
        const mime = mediaRow.mimeType;
        if (
          !mime ||
          !(MEDIA_IMAGE_MIME_TYPES as readonly string[]).includes(mime)
        ) {
          throw new BadRequestException(
            'Favicon must be an image from the media library',
          );
        }
        patch.faviconMediaId = input.faviconMediaId;
        patch.faviconUrl = mediaRow.url;
      }
    } else if (input.faviconUrl !== undefined) {
      patch.faviconUrl = input.faviconUrl;
    }

    const [row] = await this.db
      .update(siteSettings)
      .set(patch)
      .where(eq(siteSettings.id, current.id))
      .returning();
    return row;
  }

  async listNav() {
    return this.db.select().from(navItems).orderBy(asc(navItems.sortOrder));
  }

  async upsertNavItem(input: {
    id?: string;
    label: string;
    path: string;
    sortOrder?: number;
    visible?: boolean;
  }) {
    if (input.id) {
      const [row] = await this.db
        .update(navItems)
        .set({
          label: input.label,
          path: input.path,
          sortOrder: input.sortOrder ?? 0,
          visible: input.visible ?? true,
        })
        .where(eq(navItems.id, input.id))
        .returning();
      if (!row) throw new NotFoundException('Nav item not found');
      return row;
    }
    const [row] = await this.db
      .insert(navItems)
      .values({
        label: input.label,
        path: input.path,
        sortOrder: input.sortOrder ?? 0,
        visible: input.visible ?? true,
      })
      .returning();
    return row;
  }

  async getPublicSite() {
    const settings = await this.getOrCreateSettings();
    const nav = (await this.listNav()).filter((n) => n.visible);
    const [pageSlugs, researchSlugs, publicationSlugs, projectSlugs, writingSlugs] =
      await Promise.all([
        this.sitePages.listPublishedSlugs(),
        this.research.listPublishedSlugs(),
        this.publications.listPublishedSlugs(),
        this.projects.listPublishedSlugs(),
        this.writing.listPublishedSlugs(),
      ]);
    const researchPaths = [
      '/research',
      ...researchSlugs.map((s) => `/research/${s}`),
    ];
    const publicationPaths = [
      '/publications',
      ...publicationSlugs.map((s) => `/publications/${s}`),
    ];
    const projectPaths = [
      '/projects',
      ...projectSlugs.map((s) => `/projects/${s}`),
    ];
    const writingPaths =
      writingSlugs.length > 0
        ? ['/writing', ...writingSlugs.map((s) => `/writing/${s}`)]
        : [];
    return {
      siteName: settings.siteName,
      defaultMetaDescription: settings.defaultMetaDescription,
      footerText: settings.footerText,
      faviconUrl: settings.faviconUrl,
      nav,
      sitemapPaths: [
        ...researchPaths,
        ...publicationPaths,
        ...projectPaths,
        ...writingPaths,
        '/',
        '/about',
        ...pageSlugs.map((s) => `/pages/${s}`),
      ],
    };
  }
}
