import { Logger, StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppConfigService } from './config/app-config.service';
import { AppModule } from './app.module';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';
import { setupSwagger } from './swagger/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.useGlobalFilters(new ThrottlerExceptionFilter());

  const appConfig = app.get(AppConfigService);
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
