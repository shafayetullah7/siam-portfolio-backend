import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { AdminAuthRepository } from '../../domain/auth/admin-auth.repository';
import type { AdminChangePasswordBody } from './dto/admin-change-password.dto';
import type { AdminLoginBody } from './dto/admin-login.dto';
import type { AdminRegisterBody } from './dto/admin-register.dto';
import { AdminLoginService } from './services/admin-login.service';
import { AdminPasswordService } from './services/admin-password.service';
import { AdminRegistrationService } from './services/admin-registration.service';
import { AdminSessionService } from './services/admin-session.service';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly repo: AdminAuthRepository,
    private readonly loginService: AdminLoginService,
    private readonly registration: AdminRegistrationService,
    private readonly session: AdminSessionService,
    private readonly password: AdminPasswordService,
  ) {}

  login(
    body: AdminLoginBody,
    res: Response,
    meta: { userAgent?: string; ip?: string },
  ) {
    return this.loginService.login(body.email, body.password, res, meta);
  }

  async check(adminId: string) {
    const profile = await this.repo.findProfileByAdminId(adminId);
    if (!profile) throw new UnauthorizedException();
    return profile;
  }

  refresh(refreshToken: string, res: Response) {
    return this.session.refresh(refreshToken, res);
  }

  logout(sessionId: string, res: Response) {
    return this.session.logout(sessionId, res);
  }

  register(body: AdminRegisterBody) {
    return this.registration.register(body);
  }

  verifyRegistration(otp: string, res: Response) {
    return this.registration.verifyRegistration(otp, res);
  }

  registrationStatus() {
    return this.registration.registrationStatus();
  }

  forgotPassword(email: string) {
    return this.password.forgotPassword(email);
  }

  resetPassword(token: string, password: string) {
    return this.password.resetPassword(token, password);
  }

  changePassword(adminId: string, body: AdminChangePasswordBody) {
    return this.password.changePassword(
      adminId,
      body.currentPassword,
      body.newPassword,
    );
  }
}
