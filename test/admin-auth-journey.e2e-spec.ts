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

type CookieJar = Record<string, string>;

function collectSetCookies(
  setCookie: string | string[] | undefined,
): CookieJar {
  const jar: CookieJar = {};
  const list = Array.isArray(setCookie)
    ? setCookie
    : setCookie
      ? [setCookie]
      : [];
  for (const line of list) {
    const part = line.split(';')[0] ?? '';
    const eq = part.indexOf('=');
    if (eq > 0) {
      jar[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
    }
  }
  return jar;
}

function mergeCookies(jar: CookieJar, setCookie: string | string[] | undefined) {
  return { ...jar, ...collectSetCookies(setCookie) };
}

function cookieHeader(jar: CookieJar): string {
  return Object.entries(jar)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

function assertNoTokensInJsonBody(body: unknown) {
  const text = JSON.stringify(body);
  expect(text).not.toMatch(/adminAccessToken/i);
  expect(text).not.toMatch(/adminRefreshToken/i);
  expect(text).not.toMatch(/"accessToken"/);
  expect(text).not.toMatch(/"refreshToken"/);
}

describe.sequential('Admin auth journey (e2e)', () => {
  let app: INestApplication<App>;
  let lastOtp = '';

  const uniqueEmail = () => `journey-${Date.now()}@example.com`;

  const registerBody = (email: string, password: string) => ({
    firstName: 'Journey',
    lastName: 'Test',
    userName: `j_${Date.now().toString(36)}`,
    email,
    password,
  });

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

  async function registerAndVerify(email: string, password: string) {
    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/register')
      .send(registerBody(email, password))
      .expect(201);

    expect(lastOtp).toMatch(/^\d{6}$/);

    const verifyRes = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/verify-registration')
      .send({ otp: lastOtp })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    assertNoTokensInJsonBody(verifyRes.body);
    expect(verifyRes.body.data?.email).toBe(email);

    let jar = mergeCookies({}, verifyRes.headers['set-cookie']);
    expect(jar.adminAccessToken).toBeDefined();
    expect(jar['xsrf-token']).toBeDefined();

    return { jar, email, password };
  }

  it('register → verify → guarded GET → logout → guarded 401', async () => {
    const email = uniqueEmail();
    let { jar } = await registerAndVerify(email, 'Testpass1.');

    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard')
      .set('Cookie', cookieHeader(jar))
      .expect(200);

    const logoutRes = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/logout')
      .set('Cookie', cookieHeader(jar))
      .set('X-XSRF-TOKEN', jar['xsrf-token'] ?? '')
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    jar = mergeCookies(jar, logoutRes.headers['set-cookie']);

    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard')
      .set('Cookie', cookieHeader(jar))
      .expect(401);
  });

  it('register → verify → login → check → logout → guarded 401', async () => {
    const email = uniqueEmail();
    const password = 'Testpass1.';
    const { jar: verifyJar } = await registerAndVerify(email, password);

    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/logout')
      .set('Cookie', cookieHeader(verifyJar))
      .set('X-XSRF-TOKEN', verifyJar['xsrf-token'] ?? '')
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ email, password })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    assertNoTokensInJsonBody(loginRes.body);
    let jar = mergeCookies({}, loginRes.headers['set-cookie']);

    const checkRes = await request(app.getHttpServer())
      .get('/api/v1/admin/auth/check')
      .set('Cookie', cookieHeader(jar))
      .expect(200);

    expect(checkRes.body.data?.email).toBe(email);
    assertNoTokensInJsonBody(checkRes.body);

    const logoutRes = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/logout')
      .set('Cookie', cookieHeader(jar))
      .set('X-XSRF-TOKEN', jar['xsrf-token'] ?? '')
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    jar = mergeCookies(jar, logoutRes.headers['set-cookie']);

    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard')
      .set('Cookie', cookieHeader(jar))
      .expect(401);
  });
});
