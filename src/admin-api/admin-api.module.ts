import { Module } from '@nestjs/common';

/**
 * Owner CMS API (`/api/v1/admin/*`).
 * Apply JWT/session guard at module level when auth is implemented.
 * @see docs/architecture.md
 */
@Module({
  imports: [],
  controllers: [],
})
export class AdminApiModule {}
