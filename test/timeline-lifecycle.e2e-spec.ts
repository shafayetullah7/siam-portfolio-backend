import {
  BadRequestException,
  INestApplication,
  NotFoundException,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminTimelineController } from '../src/admin-api/timeline/admin-timeline.controller';
import { AdminTimelineService } from '../src/admin-api/timeline/admin-timeline.service';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { isPubliclyVisible } from '../src/common/publishing/is-publicly-visible';
import type { PublishStatus } from '../src/common/publishing/publish-status';
import { timelinePublishChecklist } from '../src/domain/timeline/timeline-publish-checklist';
import { MediaService } from '../src/domain/media/media.service';
import { TimelineService } from '../src/domain/timeline/timeline.service';
import { timelineEntryRow } from '../src/domain/timeline/timeline.test-helpers';
import type { TimelinePublicCard } from '../src/domain/timeline/timeline.types';
import { PublicTimelineController } from '../src/public-api/timeline/public-timeline.controller';
import { PublicTimelineService } from '../src/public-api/timeline/public-timeline.service';

const ENTRY_ID = '00000000-0000-4000-8000-000000000088';

describe('Timeline lifecycle (e2e)', () => {
  let adminApp: INestApplication<App>;
  let publicApp: INestApplication<App>;
  const store = new Map<string, ReturnType<typeof timelineEntryRow>>();
  const mediaAlts = new Map<string, string>();

  const timelineMock: Partial<TimelineService> = {
    findByIdAdmin: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Timeline entry not found');
      return { ...row, media: [] };
    }),
    getPublishChecklist: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Timeline entry not found');
      const media = [...mediaAlts.entries()].map(([mediaId, alt]) => ({
        mediaId,
        alt,
      }));
      return timelinePublishChecklist(row, media);
    }),
    publish: vi.fn(async (id: string, options = {}) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Timeline entry not found');
      const checklist = timelinePublishChecklist(
        row,
        [...mediaAlts.entries()].map(([mediaId, alt]) => ({ mediaId, alt })),
      );
      if (checklist.errors.length > 0) {
        throw new BadRequestException({
          message: checklist.errors.map((e) => e.message).join('; '),
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
      row.publishStatus = 'published';
      row.publishedAt = new Date();
      row.scheduledAt = null;
      return row;
    }),
    unpublish: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Timeline entry not found');
      row.publishStatus = 'draft';
      row.publishedAt = null;
      row.scheduledAt = null;
      return row;
    }),
    listPublishedAchievements: vi.fn(async () => {
      const cards: TimelinePublicCard[] = [];
      for (const row of store.values()) {
        if (
          isPubliclyVisible(
            row.publishStatus as PublishStatus,
            row.scheduledAt,
          ) &&
          row.kind === 'award'
        ) {
          cards.push({
            id: row.id,
            kind: row.kind,
            title: row.title,
            subtitle: row.subtitle,
            organization: row.organization,
            location: row.location,
            startDate: row.startDate,
            endDate: row.endDate,
            isOngoing: row.isOngoing,
            featured: row.featured,
            proofUrl: row.proofUrl,
            images: [],
          });
        }
      }
      return cards;
    }),
  };

  beforeEach(async () => {
    store.clear();
    mediaAlts.clear();
    vi.clearAllMocks();

    const row = timelineEntryRow({
      id: ENTRY_ID,
      kind: 'award',
      title: 'Prize',
      publishStatus: 'draft',
    });
    store.set(ENTRY_ID, row);

    const adminModule: TestingModule = await Test.createTestingModule({
      controllers: [AdminTimelineController],
      providers: [
        AdminTimelineService,
        { provide: TimelineService, useValue: timelineMock },
        { provide: MediaService, useValue: {} },
        {
          provide: PublicTimelineService,
          useValue: { previewById: vi.fn() },
        },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: vi.fn().mockResolvedValue(true) })
      .compile();

    adminApp = adminModule.createNestApplication();
    adminApp.setGlobalPrefix('api/v1');
    adminApp.useGlobalPipes(new StandardSchemaValidationPipe());
    adminApp.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    adminApp.useGlobalFilters(new HttpExceptionFilter());
    await adminApp.init();

    const publicModule: TestingModule = await Test.createTestingModule({
      controllers: [PublicTimelineController],
      providers: [
        PublicTimelineService,
        { provide: TimelineService, useValue: timelineMock },
      ],
    }).compile();

    publicApp = publicModule.createNestApplication();
    publicApp.setGlobalPrefix('api/v1');
    publicApp.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    publicApp.useGlobalFilters(new HttpExceptionFilter());
    await publicApp.init();
  });

  afterEach(async () => {
    if (adminApp) await adminApp.close();
    if (publicApp) await publicApp.close();
  });

  it('publish then appears on public achievements list; unpublish hides', async () => {
    const listBefore = await request(publicApp.getHttpServer())
      .get('/api/v1/public/timeline/achievements')
      .expect(200);
    expect(listBefore.body.data.sections).toEqual([]);

    await request(adminApp.getHttpServer())
      .post(`/api/v1/admin/timeline/${ENTRY_ID}/publish`)
      .send({ confirmWarnings: true })
      .expect(201);

    const listAfter = await request(publicApp.getHttpServer())
      .get('/api/v1/public/timeline/achievements')
      .expect(200);
    expect(listAfter.body.data.sections[0].items).toHaveLength(1);

    await request(adminApp.getHttpServer())
      .post(`/api/v1/admin/timeline/${ENTRY_ID}/unpublish`)
      .expect(201);

    const listFinal = await request(publicApp.getHttpServer())
      .get('/api/v1/public/timeline/achievements')
      .expect(200);
    expect(listFinal.body.data.sections).toEqual([]);
  });

  it('blocks publish when gallery image has empty alt', async () => {
    mediaAlts.set('00000000-0000-4000-8000-000000000001', '');

    await request(adminApp.getHttpServer())
      .post(`/api/v1/admin/timeline/${ENTRY_ID}/publish`)
      .send({ confirmWarnings: true })
      .expect(400);
  });
});
