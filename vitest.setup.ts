process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://siam:siam@localhost:5444/siam';
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.PORT = process.env.PORT ?? '5000';
process.env.POSTGRES_USER = process.env.POSTGRES_USER ?? 'siam';
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? 'siam';
process.env.POSTGRES_DB = process.env.POSTGRES_DB ?? 'siam';
process.env.APP_EXTERNAL_PORT = process.env.APP_EXTERNAL_PORT ?? '5000';
process.env.DB_EXTERNAL_PORT = process.env.DB_EXTERNAL_PORT ?? '5444';
process.env.DOCKER_BUILD_TARGET =
  process.env.DOCKER_BUILD_TARGET ?? 'development';
process.env.JWT_ADMIN_ACCESS_SECRET =
  process.env.JWT_ADMIN_ACCESS_SECRET ??
  'test-access-secret-min-32-characters-long!!';
process.env.JWT_ADMIN_REFRESH_SECRET =
  process.env.JWT_ADMIN_REFRESH_SECRET ??
  'test-refresh-secret-min-32-characters-long!';
process.env.ADMIN_REGISTRATION_ENABLED =
  process.env.ADMIN_REGISTRATION_ENABLED ?? 'true';
process.env.ADMIN_OTP_RECIPIENT_EMAIL =
  process.env.ADMIN_OTP_RECIPIENT_EMAIL ?? 'owner@example.com';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
process.env.FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';
