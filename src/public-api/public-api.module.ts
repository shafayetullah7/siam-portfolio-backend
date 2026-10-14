import { Module } from '@nestjs/common';
import { HealthController } from '../health/health.controller';
import { HealthModule } from '../health/health.module';

/**
 * Public portfolio API (`/api/v1/public/*`).
 * Register public controllers here; import feature modules for providers.
 * @see docs/architecture.md
 */
@Module({
  imports: [HealthModule],
  controllers: [HealthController],
})
export class PublicApiModule {}
