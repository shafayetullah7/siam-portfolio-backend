import { Module } from '@nestjs/common';
import { HealthService } from './health.service';

/** Provides health check logic; HTTP route is registered on `PublicApiModule`. */
@Module({
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
