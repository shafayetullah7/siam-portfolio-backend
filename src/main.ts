import { Logger, StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppConfigService } from './config/app-config.service';
import { validateCloudinaryConfigForBoot } from './config/validate-cloudinary-config';
import { validateMailConfigForBoot } from './config/validate-mail-config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ApiEnvelopeInterceptor } from './common/interceptors/api-envelope.interceptor';
import { setupSwagger } from './swagger/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const appConfig = app.get(AppConfigService);
  validateMailConfigForBoot(appConfig);
  validateCloudinaryConfigForBoot(appConfig);
  app.enableCors({
    origin: appConfig.corsOrigin,
    credentials: true,
  });

  setupSwagger(app);
  await app.listen(appConfig.port);
  const url = await app.getUrl();
  Logger.log(`Application is running on: ${url}`, 'Bootstrap');
  Logger.log(`Swagger UI: ${url}/api`, 'Bootstrap');
  Logger.log(
    `Public health: ${url}/api/v1/public/health`,
    'Bootstrap',
  );
}
bootstrap();
