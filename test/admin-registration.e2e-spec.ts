import {
  INestApplication,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/domain/auth/email.service';
import { ThrottlerExceptionFilter } from '../src/common/filters/throttler-exception.filter';

describe('Admin registration (e2e)', () => {
  let app: INestApplication<App>;
  let lastOtp = '';

  const unique = () => `reg-${Date.now()}@example.com`;

  beforeEach(async () => {
    lastOtp = '';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendAdminRegistrationOtp: async (_email: string, otp: string) => {
          lastOtp = otp;
        },
        sendPasswordResetLink: vi.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    app.useGlobalFilters(new ThrottlerExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('register → verify sets session cookies', async () => {
    const email = unique();
    const registerBody = {
      firstName: 'Test',
      lastName: 'Admin',
      userName: `user_${Date.now().toString(36)}`,
      email,
      password: 'Testpass1.',
    };

    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/register')
      .send(registerBody)
      .expect(201);

    expect(lastOtp).toMatch(/^\d{6}$/);

    const verifyRes = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/verify-registration')
      .send({ otp: lastOtp })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const cookies = verifyRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const joined = Array.isArray(cookies) ? cookies.join(';') : String(cookies);
    expect(joined).toContain('adminAccessToken');
    expect(joined).toContain('adminRefreshToken');
    expect(verifyRes.body.data?.email).toBe(email);
  });

  it('rejects weak register password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'Admin',
        userName: `user_${Date.now().toString(36)}`,
        email: unique(),
        password: 'password12',
      })
      .expect(400);
  });
});
