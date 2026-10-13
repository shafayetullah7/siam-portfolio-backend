import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'provision'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.url(),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  APP_EXTERNAL_PORT: z.coerce.number().int().positive().default(5000),
  DB_EXTERNAL_PORT: z.coerce.number().int().positive().default(5444),
  DOCKER_BUILD_TARGET: z
    .enum(['development', 'production'])
    .default('development'),
});

export type AppEnv = z.infer<typeof envSchema>;
