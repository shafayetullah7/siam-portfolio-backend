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

const FORGOT_MESSAGE =
  'If an account exists for that email, password reset instructions were sent.';

describe.sequential('Admin password reset (e2e)', () => {
  let app: INestApplication<App>;
  let lastResetLink = '';
  let lastOtp = '';

  const uniqueEmail = () => `pwd-${Date.now()}@example.com`;

  async function createAdminViaRegistration(email: string, password: string) {
    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/register')
      .send({
        firstName: 'Pwd',
        lastName: 'Test',
        userName: `pwd_${Date.now().toString(36)}`,
        email,
        password,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/verify-registration')
      .send({ otp: lastOtp })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });
  }

  beforeEach(async () => {
    lastResetLink = '';
    lastOtp = '';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendAdminRegistrationOtp: async (_email: string, otp: string) => {
          lastOtp = otp;
        },
        sendPasswordResetLink: async (_email: string, link: string) => {
          lastResetLink = link;
        },
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

  function tokenFromLink(): string {
    const url = new URL(lastResetLink);
    const token = url.searchParams.get('token');
    if (!token) throw new Error('missing token in reset link');
    return token;
  }

  it('forgot returns the same message for unknown and known email', async () => {
    const unknown = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/forgot-password')
      .send({ email: 'nobody@example.com' })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const email = uniqueEmail();
    await createAdminViaRegistration(email, 'password12');

    const known = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/forgot-password')
      .send({ email })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    expect(unknown.body.data?.message).toBe(FORGOT_MESSAGE);
    expect(known.body.data?.message).toBe(FORGOT_MESSAGE);
    expect(lastResetLink).toContain('/admin/reset-password?token=');
  });

  it('forgot → reset → login; reused token fails', async () => {
    const email = uniqueEmail();
    const oldPassword = 'password12';
    const newPassword = 'newpassword99';
    await createAdminViaRegistration(email, oldPassword);

    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/forgot-password')
      .send({ email })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const token = tokenFromLink();

    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/reset-password')
      .send({ token, password: newPassword })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/reset-password')
      .send({ token, password: 'anotherpass1' })
      .expect(400);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ email, password: newPassword })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const cookies = loginRes.headers['set-cookie'];
    expect(String(cookies)).toContain('adminAccessToken');
  });
});
