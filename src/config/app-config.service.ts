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
}
