import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { envSchema } from './config/env.schema';
import { AdminApiModule } from './admin-api/admin-api.module';
import { PublicApiModule } from './public-api/public-api.module';
import { CookieModule } from './libs/cookie/cookie.module';
import { HashingModule } from './libs/hashing/hashing.module';
import { CloudinaryModule } from './libs/cloudinary/cloudinary.module';
import { MailModule } from './libs/mail/mail.module';
import { ResearchModule } from './domain/research/research.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import * as schema from './db/schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
    }),
    ScheduleModule.forRoot(),
    AppConfigModule,
    MailModule,
    CloudinaryModule,
    HashingModule,
    CookieModule,
    DrizzleModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        drizzle,
        connection: appConfig.databaseUrl,
        schema,
      }),
    }),
    SchedulingModule,
    ResearchModule,
    PublicApiModule,
    AdminApiModule,
  ],
})
export class AppModule {}
