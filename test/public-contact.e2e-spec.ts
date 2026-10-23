import {
  BadRequestException,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppConfigService } from '../src/config/app-config.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { ContactService } from '../src/domain/contact/contact.service';
import { SiteService } from '../src/domain/site/site.service';
import { PublicContactController } from '../src/public-api/contact/public-contact.controller';
import {
  PUBLIC_CONTACT_THROTTLE,
  PUBLIC_CONTACT_THROTTLE_MODULE_DEFAULT,
} from '../src/public-api/contact/public-contact-throttle.constants';
import { PublicContactService } from '../src/public-api/contact/public-contact.service';

const validBody = {
  name: 'Ada',
  email: 'ada@example.com',
  message: 'Hello world!',
  consent: false,
};

describe('Public contact (e2e)', () => {
  let app: INestApplication<App>;
  const submitInquiry = vi.fn().mockResolvedValue({
    id: 'msg-1',
    senderEmail: 'ada@example.com',
    body: 'Hello world!',
  });

  beforeEach(async () => {
    submitInquiry.mockClear();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: PUBLIC_CONTACT_THROTTLE_MODULE_DEFAULT.ttl,
            limit: PUBLIC_CONTACT_THROTTLE_MODULE_DEFAULT.limit,
          },
        ]),
      ],
      controllers: [PublicContactController],
      providers: [
        PublicContactService,
        {
          provide: ContactService,
          useValue: { submitInquiry },
        },
        {
          provide: SiteService,
          useValue: {
            getContactConfig: vi.fn().mockResolvedValue({
              formEnabled: true,
              intro: 'Contact us',
              collaborationGuidance: null,
              responseTimeNote: null,
              categories: ['Collaboration'],
              consentText: null,
              successMessage: 'Thanks!',
              publicEmail: null,
              showEmailOnPage: false,
            }),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            isTurnstileEnabled: false,
            turnstileSiteKey: null,
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('GET /public/contact/config returns form settings', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/contact/config')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.formEnabled).toBe(true);
    expect(res.body.data.categories).toEqual(['Collaboration']);
    expect(res.body.data.turnstileSiteKey).toBeNull();
  });

  it('POST /public/contact returns acknowledged without PII', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/public/contact')
      .send(validBody)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ acknowledged: true });
    expect(JSON.stringify(res.body)).not.toContain('ada@example.com');
    expect(JSON.stringify(res.body)).not.toContain('Hello world!');
    expect(submitInquiry).toHaveBeenCalledTimes(1);
  });

  it('POST returns 400 when domain rejects submission', async () => {
    submitInquiry.mockRejectedValueOnce(new BadRequestException('Invalid'));

    await request(app.getHttpServer())
      .post('/api/v1/public/contact')
      .send(validBody)
      .expect(400);
  });

  it('POST is rate limited after repeated submissions', async () => {
    const limit = PUBLIC_CONTACT_THROTTLE.submit.limit;
    for (let i = 0; i < limit; i++) {
      await request(app.getHttpServer())
        .post('/api/v1/public/contact')
        .send(validBody)
        .expect(201);
    }
    const res = await request(app.getHttpServer())
      .post('/api/v1/public/contact')
      .send(validBody)
      .expect(429);

    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(429);
  });
});
