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
  /** Frontend origin for CORS + credentials (Phase 5 admin cookies). */
  CORS_ORIGIN: z.url().default('http://localhost:5001'),
  FRONTEND_URL: z.url().default('http://localhost:5001'),
  COOKIE_DOMAIN: z.string().optional(),
  SESSION_MAX_AGE_MS: z.coerce.number().int().positive().default(604_800_000),
  JWT_ADMIN_ACCESS_SECRET: z
    .string()
    .min(32)
    .default('dev-access-secret-min-32-chars-long!!'),
  JWT_ADMIN_REFRESH_SECRET: z
    .string()
    .min(32)
    .default('dev-refresh-secret-min-32-chars-long!'),
  JWT_ADMIN_ACCESS_EXP: z.string().default('1h'),
  JWT_ADMIN_REFRESH_EXP: z.string().default('7d'),
  ADMIN_REGISTRATION_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  ADMIN_OTP_RECIPIENT_EMAIL: z
    .string()
    .email()
    .default('admin@example.com'),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(15),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  /** `console` logs mail to the API logger; `resend` sends via Resend when API key is set. */
  MAIL_PROVIDER: z.enum(['console', 'resend']).default('console'),
  RESEND_API_KEY: z.string().default('re_placeholder_replace_with_real_key'),
  /** Resend `from` — use a verified domain in production (e.g. `SIAM <noreply@yourdomain.com>`). */
  MAIL_FROM: z.string().min(3).default('SIAM Admin <onboarding@resend.dev>'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).default('placeholder_cloud_name'),
  CLOUDINARY_API_KEY: z.string().min(1).default('placeholder_api_key'),
  CLOUDINARY_API_SECRET: z
    .string()
    .min(1)
    .default('placeholder_api_secret'),
  /** Cloudflare Turnstile — when both are set, contact submit requires a valid token. */
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  TURNSTILE_SITE_KEY: z.string().min(1).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;
