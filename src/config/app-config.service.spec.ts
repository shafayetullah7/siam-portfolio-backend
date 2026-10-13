import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigModule } from './app-config.module';
import { AppConfigService } from './app-config.service';
import { envSchema } from './env.schema';

describe('AppConfigService', () => {
  let appConfig: AppConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema: envSchema,
          ignoreEnvFile: true,
          load: [
            () => ({
              NODE_ENV: 'test',
              PORT: 5000,
              DATABASE_URL: 'postgresql://siam:siam@localhost:5432/siam',
              POSTGRES_USER: 'siam',
              POSTGRES_PASSWORD: 'siam',
              POSTGRES_DB: 'siam',
              APP_EXTERNAL_PORT: 5000,
              DB_EXTERNAL_PORT: 5432,
              DOCKER_BUILD_TARGET: 'development',
            }),
          ],
        }),
        AppConfigModule,
      ],
    }).compile();

    appConfig = module.get(AppConfigService);
  });

  it('exposes typed env values', () => {
    expect(appConfig.port).toBe(5000);
    expect(appConfig.databaseUrl).toContain('postgresql://');
    expect(appConfig.nodeEnv).toBe('test');
    expect(appConfig.isDevelopment).toBe(false);
  });
});
