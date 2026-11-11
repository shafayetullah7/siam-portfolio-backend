import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { homepage, profile } from '../../db/schema/profile-home';
import { MediaService } from '../media/media.service';
import { listUnpublishedFeaturedOnHome } from './home-featured-audit';
import { getHomeFeaturedSummary } from './home-featured-summary';
import type { HomeFeaturedSummaryResponse } from './home-featured-summary.types';
import { homePublishChecklist } from './home-publish-checklist';
import { normalizeHomeSections } from './home-sections';
import { profilePublishChecklist } from './profile-publish-checklist';
import type {
  PublishChecklistResult,
  PublishSingletonOptions,
} from './publish-checklist.types';
import {
  homeCollaborationCtaSchema,
  homeCurrentlyWorkingOnSchema,
  homeHighlightsArraySchema,
  profileExpertiseSchema,
  scholarlyProfilesArraySchema,
} from './profile-home-json.schemas';
import { mapPublicAbout } from './public-about.mapper';
import { resolveHeroPortraitForPublic } from './profile-home-hero-media';
import { mapAdminAggregate, mapHomePublicShell } from './profile-home.mapper';
import {
  EMPTY_HOME_PUBLIC_SHELL,
  type HomeAdminAggregate,
  type HomePublicShell,
  type PublicAboutResponse,
} from './profile-home.types';

@Injectable()
export class ProfileHomeService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly media: MediaService,
  ) {}

  private async mediaAltContext(
    mediaId: string | null | undefined,
  ): Promise<{ alt: string | null; missing: boolean }> {
    if (!mediaId) {
      return { alt: null, missing: false };
    }
    try {
      const row = await this.media.findById(mediaId);
      return { alt: row.alt, missing: false };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { alt: null, missing: true };
      }
      throw error;
    }
  }

  private throwIfPublishBlocked(
    checklist: PublishChecklistResult,
    options: PublishSingletonOptions,
  ): void {
    if (checklist.errors.length > 0) {
      throw new BadRequestException({
        message: checklist.errors.map((item) => item.message).join('; '),
        code: 'PUBLISH_BLOCKED',
        checklist,
      });
    }
    if (checklist.warnings.length > 0 && !options.confirmWarnings) {
      throw new BadRequestException({
        message: 'Confirm publish warnings before continuing',
        code: 'PUBLISH_WARNINGS',
        checklist,
      });
    }
  }

  private async getOrCreateProfile() {
    const [row] = await this.db.select().from(profile).limit(1);
    if (row) return row;
    const [created] = await this.db.insert(profile).values({}).returning();
    return created;
  }

  private async getOrCreateHomepage() {
    const [row] = await this.db.select().from(homepage).limit(1);
    if (row) return row;
    const [created] = await this.db.insert(homepage).values({}).returning();
    return created;
  }

  async getAdminAggregate(): Promise<HomeAdminAggregate> {
    const [p, h] = await Promise.all([
      this.getOrCreateProfile(),
      this.getOrCreateHomepage(),
    ]);
    return mapAdminAggregate(p, h);
  }

  async getPublicAbout() {
    const p = await this.getOrCreateProfile();
    return {
      headline: p.headline,
      shortBio: p.shortBio,
      longBio: p.longBio,
      affiliation: p.affiliation,
    };
  }

  async getPublicAboutPublished() {
    const p = await this.getOrCreateProfile();
    if (p.publishStatus !== 'published') {
      return {
        headline: null,
        shortBio: null,
        longBio: null,
        affiliation: null,
      };
    }
    return {
      headline: p.headline,
      shortBio: p.shortBio,
      longBio: p.longBio,
      affiliation: p.affiliation,
    };
  }

  async getPublicHome() {
    const h = await this.getOrCreateHomepage();
    return {
      heroTitle: h.heroTitle,
      heroSubtitle: h.heroSubtitle,
    };
  }

  private async enrichHomePublicShell(
    profileRow: typeof profile.$inferSelect,
    homepageRow: typeof homepage.$inferSelect,
  ): Promise<HomePublicShell> {
    const shell = mapHomePublicShell(profileRow, homepageRow);
    const portrait = await resolveHeroPortraitForPublic(
      this.media,
      homepageRow.heroMediaId,
      profileRow.portraitMediaId,
    );
    return {
      ...shell,
      heroPortraitUrl: portrait?.url ?? null,
      heroPortraitAlt: portrait?.alt ?? null,
    };
  }

  async getPublicHomeShellPublished(): Promise<HomePublicShell> {
    const [p, h] = await Promise.all([
      this.getOrCreateProfile(),
      this.getOrCreateHomepage(),
    ]);
    if (h.publishStatus !== 'published') {
      return structuredClone(EMPTY_HOME_PUBLIC_SHELL);
    }
    return this.enrichHomePublicShell(p, h);
  }

  /** HOME3: wire PublicSiteService to this instead of legacy getPublicHome. */
  async getPublicHomeForSiteFacade(): Promise<HomePublicShell> {
    return this.getPublicHomeShellPublished();
  }

  async getHomeShellDraft(): Promise<HomePublicShell> {
    const [p, h] = await Promise.all([
      this.getOrCreateProfile(),
      this.getOrCreateHomepage(),
    ]);
    return this.enrichHomePublicShell(p, h);
  }

  async isHomepagePublished(): Promise<boolean> {
    const h = await this.getOrCreateHomepage();
    return h.publishStatus === 'published';
  }

  async getPublicAboutForSite(): Promise<PublicAboutResponse> {
    const p = await this.getOrCreateProfile();
    return mapPublicAbout(p);
  }

  async getFeaturedSummary(): Promise<HomeFeaturedSummaryResponse> {
    return getHomeFeaturedSummary(this.db);
  }

  private parseHomepageJsonFields(
    input: Record<string, unknown>,
  ): Record<string, unknown> {
    const patch = { ...input };
    if ('sections' in patch && patch.sections !== undefined) {
      patch.sections = normalizeHomeSections(patch.sections);
    }
    if ('highlights' in patch && patch.highlights !== undefined) {
      const parsed = homeHighlightsArraySchema.safeParse(patch.highlights);
      if (!parsed.success) {
        throw new BadRequestException('highlights must be a valid array');
      }
      patch.highlights = parsed.data;
    }
    if (
      'currentlyWorkingOn' in patch &&
      patch.currentlyWorkingOn !== undefined
    ) {
      if (patch.currentlyWorkingOn === null) {
        patch.currentlyWorkingOn = null;
      } else {
        const parsed = homeCurrentlyWorkingOnSchema.safeParse(
          patch.currentlyWorkingOn,
        );
        if (!parsed.success) {
          throw new BadRequestException('currentlyWorkingOn is invalid');
        }
        patch.currentlyWorkingOn = parsed.data;
      }
    }
    if (
      'collaborationCta' in patch &&
      patch.collaborationCta !== undefined
    ) {
      if (patch.collaborationCta === null) {
        patch.collaborationCta = null;
      } else {
        const parsed = homeCollaborationCtaSchema.safeParse(
          patch.collaborationCta,
        );
        if (!parsed.success) {
          throw new BadRequestException('collaborationCta is invalid');
        }
        patch.collaborationCta = parsed.data;
      }
    }
    if ('profiles' in patch && patch.profiles !== undefined) {
      const parsed = scholarlyProfilesArraySchema.safeParse(patch.profiles);
      if (!parsed.success) {
        throw new BadRequestException('profiles must be a valid array');
      }
      patch.profiles = parsed.data;
    }
    return patch;
  }

  async updateProfile(input: Partial<typeof profile.$inferInsert>) {
    const raw = input as Record<string, unknown>;
    let patch: Partial<typeof profile.$inferInsert> = { ...input };
    if (raw.scholarlyProfiles !== undefined) {
      const parsed = scholarlyProfilesArraySchema.safeParse(raw.scholarlyProfiles);
      if (!parsed.success) {
        throw new BadRequestException('scholarlyProfiles must be a valid array');
      }
      patch = { ...patch, scholarlyProfiles: parsed.data };
    }
    if (raw.expertise !== undefined) {
      if (raw.expertise === null) {
        patch = { ...patch, expertise: null };
      } else {
        const parsed = profileExpertiseSchema.safeParse(raw.expertise);
        if (!parsed.success) {
          throw new BadRequestException('expertise is invalid');
        }
        patch = { ...patch, expertise: parsed.data };
      }
    }
    const current = await this.getOrCreateProfile();
    const [row] = await this.db
      .update(profile)
      .set(patch)
      .where(eq(profile.id, current.id))
      .returning();
    return row;
  }

  async updateHomepage(input: Partial<typeof homepage.$inferInsert>) {
    const patch = this.parseHomepageJsonFields(
      input as Record<string, unknown>,
    ) as Partial<typeof homepage.$inferInsert>;
    const current = await this.getOrCreateHomepage();
    const [row] = await this.db
      .update(homepage)
      .set(patch)
      .where(eq(homepage.id, current.id))
      .returning();
    return row;
  }

  async getHomepagePublishChecklist(): Promise<PublishChecklistResult> {
    const [p, h, featured] = await Promise.all([
      this.getOrCreateProfile(),
      this.getOrCreateHomepage(),
      listUnpublishedFeaturedOnHome(this.db),
    ]);
    const heroMedia = await this.mediaAltContext(h.heroMediaId);
    return homePublishChecklist({
      heroTitle: h.heroTitle,
      heroDescriptor: h.heroDescriptor,
      displayName: p.displayName,
      headline: p.headline,
      heroMediaId: h.heroMediaId,
      heroMediaAlt: heroMedia.alt,
      heroMediaMissing: heroMedia.missing,
      unpublishedFeaturedThemeTitles: featured.themeTitles,
      unpublishedFeaturedPublicationTitles: featured.publicationTitles,
      unpublishedFeaturedProjectTitles: featured.projectTitles,
    });
  }

  async publishHomepage(
    options: PublishSingletonOptions = {},
  ): Promise<typeof homepage.$inferSelect> {
    const checklist = await this.getHomepagePublishChecklist();
    this.throwIfPublishBlocked(checklist, options);
    const current = await this.getOrCreateHomepage();
    const now = new Date();
    const [row] = await this.db
      .update(homepage)
      .set({
        publishStatus: 'published',
        publishedAt: now,
        scheduledAt: null,
        archivedAt: null,
      })
      .where(eq(homepage.id, current.id))
      .returning();
    if (!row) {
      throw new NotFoundException('Homepage not found');
    }
    return row;
  }

  async unpublishHomepage(): Promise<typeof homepage.$inferSelect> {
    const current = await this.getOrCreateHomepage();
    const [row] = await this.db
      .update(homepage)
      .set({
        publishStatus: 'draft',
        scheduledAt: null,
        archivedAt: null,
      })
      .where(eq(homepage.id, current.id))
      .returning();
    if (!row) {
      throw new NotFoundException('Homepage not found');
    }
    return row;
  }

  async getProfilePublishChecklist(): Promise<PublishChecklistResult> {
    const p = await this.getOrCreateProfile();
    const portraitMedia = await this.mediaAltContext(p.portraitMediaId);
    return profilePublishChecklist({
      displayName: p.displayName,
      headline: p.headline,
      portraitMediaId: p.portraitMediaId,
      portraitMediaAlt: portraitMedia.alt,
      portraitMediaMissing: portraitMedia.missing,
    });
  }

  async publishProfile(
    options: PublishSingletonOptions = {},
  ): Promise<typeof profile.$inferSelect> {
    const checklist = await this.getProfilePublishChecklist();
    this.throwIfPublishBlocked(checklist, options);
    const current = await this.getOrCreateProfile();
    const now = new Date();
    const [row] = await this.db
      .update(profile)
      .set({
        publishStatus: 'published',
        publishedAt: now,
        scheduledAt: null,
        archivedAt: null,
      })
      .where(eq(profile.id, current.id))
      .returning();
    if (!row) {
      throw new NotFoundException('Profile not found');
    }
    return row;
  }

  async unpublishProfile(): Promise<typeof profile.$inferSelect> {
    const current = await this.getOrCreateProfile();
    const [row] = await this.db
      .update(profile)
      .set({
        publishStatus: 'draft',
        scheduledAt: null,
        archivedAt: null,
      })
      .where(eq(profile.id, current.id))
      .returning();
    if (!row) {
      throw new NotFoundException('Profile not found');
    }
    return row;
  }
}
