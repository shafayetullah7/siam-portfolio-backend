import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  providers: [AdminAuthGuard],
  exports: [AdminAuthGuard, JwtModule],
})
export class AdminApiSharedModule {}
