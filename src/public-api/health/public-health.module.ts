import { Module } from '@nestjs/common';
import { HealthModule } from '../../health/health.module';
import { PublicHealthController } from './public-health.controller';

@Module({
  imports: [HealthModule],
  controllers: [PublicHealthController],
})
export class PublicHealthModule {}
