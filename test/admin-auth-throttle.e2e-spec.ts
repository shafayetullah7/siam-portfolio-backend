import {
  INestApplication,
  StandardSchemaValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminAuthController } from '../src/admin-api/auth/admin-auth.controller';
import {
  ADMIN_AUTH_THROTTLE,
  ADMIN_AUTH_THROTTLE_MODULE_DEFAULT,
} from '../src/admin-api/auth/admin-auth-throttle.constants';
import { AdminAuthService } from '../src/admin-api/auth/admin-auth.service';
import { ThrottlerExceptionFilter } from '../src/common/filters/throttler-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';

describe('Admin auth throttle (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: ADMIN_AUTH_THROTTLE_MODULE_DEFAULT.ttl,
            limit: ADMIN_AUTH_THROTTLE_MODULE_DEFAULT.limit,
          },
        ]),
      ],
      controllers: [AdminAuthController],
      providers: [
        {
          provide: AdminAuthService,
          useValue: {
            login: vi
              .fn()
              .mockRejectedValue(new UnauthorizedException('Invalid password')),
          },
        },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: vi.fn().mockResolvedValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    app.useGlobalFilters(new ThrottlerExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 429 after exceeding login throttle', async () => {
    const loginBody = { email: 'admin@example.com', password: 'password12' };
    const { limit } = ADMIN_AUTH_THROTTLE.login;

    for (let i = 0; i < limit; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/auth/login')
        .send(loginBody);
      expect(res.status).not.toBe(429);
    }

    const throttled = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send(loginBody)
      .expect(429);

    expect(throttled.body).toMatchObject({
      success: false,
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
    });
  });
});
