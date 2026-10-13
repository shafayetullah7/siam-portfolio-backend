process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://siam:siam@localhost:5432/siam';
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.PORT = process.env.PORT ?? '5000';
process.env.POSTGRES_USER = process.env.POSTGRES_USER ?? 'siam';
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? 'siam';
process.env.POSTGRES_DB = process.env.POSTGRES_DB ?? 'siam';
process.env.APP_EXTERNAL_PORT = process.env.APP_EXTERNAL_PORT ?? '5000';
process.env.DB_EXTERNAL_PORT = process.env.DB_EXTERNAL_PORT ?? '5432';
process.env.DOCKER_BUILD_TARGET =
  process.env.DOCKER_BUILD_TARGET ?? 'development';
