import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppEnv } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppEnv, true>) {}

  get nodeEnv(): AppEnv['NODE_ENV'] {
    return this.configService.getOrThrow('NODE_ENV');
  }

  get port(): AppEnv['PORT'] {
    return this.configService.getOrThrow('PORT');
  }

  get databaseUrl(): AppEnv['DATABASE_URL'] {
    return this.configService.getOrThrow('DATABASE_URL');
  }

  get postgresUser(): AppEnv['POSTGRES_USER'] {
    return this.configService.getOrThrow('POSTGRES_USER');
  }

  get postgresPassword(): AppEnv['POSTGRES_PASSWORD'] {
    return this.configService.getOrThrow('POSTGRES_PASSWORD');
  }

  get postgresDb(): AppEnv['POSTGRES_DB'] {
    return this.configService.getOrThrow('POSTGRES_DB');
  }

  get appExternalPort(): AppEnv['APP_EXTERNAL_PORT'] {
    return this.configService.getOrThrow('APP_EXTERNAL_PORT');
  }

  get dbExternalPort(): AppEnv['DB_EXTERNAL_PORT'] {
    return this.configService.getOrThrow('DB_EXTERNAL_PORT');
  }

  get dockerBuildTarget(): AppEnv['DOCKER_BUILD_TARGET'] {
    return this.configService.getOrThrow('DOCKER_BUILD_TARGET');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get corsOrigin(): AppEnv['CORS_ORIGIN'] {
    return this.configService.getOrThrow('CORS_ORIGIN');
  }

  get frontendUrl(): AppEnv['FRONTEND_URL'] {
    return this.configService.getOrThrow('FRONTEND_URL');
  }

  get cookieDomain(): string | undefined {
    return this.configService.get('COOKIE_DOMAIN');
  }

  get sessionMaxAgeMs(): AppEnv['SESSION_MAX_AGE_MS'] {
    return this.configService.getOrThrow('SESSION_MAX_AGE_MS');
  }

  get jwtAdminAccessSecret(): AppEnv['JWT_ADMIN_ACCESS_SECRET'] {
    return this.configService.getOrThrow('JWT_ADMIN_ACCESS_SECRET');
  }

  get jwtAdminRefreshSecret(): AppEnv['JWT_ADMIN_REFRESH_SECRET'] {
    return this.configService.getOrThrow('JWT_ADMIN_REFRESH_SECRET');
  }

  get jwtAdminAccessExp(): AppEnv['JWT_ADMIN_ACCESS_EXP'] {
    return this.configService.getOrThrow('JWT_ADMIN_ACCESS_EXP');
  }

  get jwtAdminRefreshExp(): AppEnv['JWT_ADMIN_REFRESH_EXP'] {
    return this.configService.getOrThrow('JWT_ADMIN_REFRESH_EXP');
  }

  get adminRegistrationEnabled(): AppEnv['ADMIN_REGISTRATION_ENABLED'] {
    return this.configService.getOrThrow('ADMIN_REGISTRATION_ENABLED');
  }

  get adminOtpRecipientEmail(): AppEnv['ADMIN_OTP_RECIPIENT_EMAIL'] {
    return this.configService.getOrThrow('ADMIN_OTP_RECIPIENT_EMAIL');
  }

  get otpExpiryMinutes(): AppEnv['OTP_EXPIRY_MINUTES'] {
    return this.configService.getOrThrow('OTP_EXPIRY_MINUTES');
  }

  get otpMaxAttempts(): AppEnv['OTP_MAX_ATTEMPTS'] {
    return this.configService.getOrThrow('OTP_MAX_ATTEMPTS');
  }

  get otpResendCooldownSeconds(): AppEnv['OTP_RESEND_COOLDOWN_SECONDS'] {
    return this.configService.getOrThrow('OTP_RESEND_COOLDOWN_SECONDS');
  }

  get mailProvider(): AppEnv['MAIL_PROVIDER'] {
    return this.configService.getOrThrow('MAIL_PROVIDER');
  }

  get resendApiKey(): AppEnv['RESEND_API_KEY'] {
    return this.configService.getOrThrow('RESEND_API_KEY');
  }

  get mailFrom(): AppEnv['MAIL_FROM'] {
    return this.configService.getOrThrow('MAIL_FROM');
  }
}
