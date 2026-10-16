import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthDomainModule } from '../../domain/auth/auth-domain.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import {
  ADMIN_AUTH_THROTTLE_MODULE_DEFAULT,
} from './admin-auth-throttle.constants';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginService } from './services/admin-login.service';
import { AdminPasswordService } from './services/admin-password.service';
import { AdminRegistrationService } from './services/admin-registration.service';
import { AdminSessionService } from './services/admin-session.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: ADMIN_AUTH_THROTTLE_MODULE_DEFAULT.ttl,
        limit: ADMIN_AUTH_THROTTLE_MODULE_DEFAULT.limit,
      },
    ]),
    AdminApiSharedModule,
    AuthDomainModule,
  ],
  controllers: [AdminAuthController],
  providers: [
    AdminAuthService,
    AdminLoginService,
    AdminRegistrationService,
    AdminSessionService,
    AdminPasswordService,
  ],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
