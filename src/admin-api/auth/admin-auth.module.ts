import { Module } from '@nestjs/common';
import { AuthDomainModule } from '../../domain/auth/auth-domain.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginService } from './services/admin-login.service';
import { AdminPasswordService } from './services/admin-password.service';
import { AdminRegistrationService } from './services/admin-registration.service';
import { AdminSessionService } from './services/admin-session.service';

@Module({
  imports: [AdminApiSharedModule, AuthDomainModule],
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
