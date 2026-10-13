import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { envSchema } from './config/env.schema';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminApiModule } from './admin-api/admin-api.module';
import { HealthModule } from './health/health.module';
import { PublicApiModule } from './public-api/public-api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
    }),
    AppConfigModule,
    DrizzleModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        drizzle,
        connection: appConfig.databaseUrl,
      }),
    }),
    HealthModule,
    PublicApiModule,
    AdminApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
