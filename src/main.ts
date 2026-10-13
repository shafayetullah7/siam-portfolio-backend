import { Logger, StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppConfigService } from './config/app-config.service';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  setupSwagger(app);
  const appConfig = app.get(AppConfigService);
  await app.listen(appConfig.port);
  const url = await app.getUrl();
  Logger.log(`Application is running on: ${url}`, 'Bootstrap');
  Logger.log(`Swagger UI: ${url}/api`, 'Bootstrap');
}
bootstrap();
