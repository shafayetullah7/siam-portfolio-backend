import { Module } from '@nestjs/common';
import { AdminAuthRepository } from './admin-auth.repository';
import { EmailService } from './email.service';

@Module({
  providers: [AdminAuthRepository, EmailService],
  exports: [AdminAuthRepository, EmailService],
})
export class AuthDomainModule {}
