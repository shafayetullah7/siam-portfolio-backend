import {
  Body,
  Controller,
  Cookies,
  Get,
  Headers,
  Ip,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  SkipThrottle,
  Throttle,
  ThrottlerGuard,
} from '@nestjs/throttler';
import type { Response } from 'express';
import { ADMIN_AUTH_THROTTLE } from './admin-auth-throttle.constants';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';
import {
  adminChangePasswordBodySchema,
  type AdminChangePasswordBody,
} from './dto/admin-change-password.dto';
import {
  adminForgotPasswordBodySchema,
  type AdminForgotPasswordBody,
} from './dto/admin-forgot-password.dto';
import { adminLoginBodySchema, type AdminLoginBody } from './dto/admin-login.dto';
import {
  adminRegisterBodySchema,
  type AdminRegisterBody,
} from './dto/admin-register.dto';
import {
  adminResetPasswordBodySchema,
  type AdminResetPasswordBody,
} from './dto/admin-reset-password.dto';
import {
  adminVerifyRegistrationBodySchema,
  type AdminVerifyRegistrationBody,
} from './dto/admin-verify-registration.dto';

@ApiTags('admin-auth')
@Controller('admin/auth')
@UseGuards(ThrottlerGuard, AdminAuthGuard)
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Public()
  @Throttle({ default: ADMIN_AUTH_THROTTLE.login })
  @Post('login')
  @ApiOperation({ summary: 'Admin login (email + password, sets session cookies)' })
  async login(
    @Body({ schema: adminLoginBodySchema }) body: AdminLoginBody,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.auth.login(body, res, {
      userAgent,
      ip,
    });
  }

  @SkipThrottle({ default: true })
  @Post('logout')
  @ApiOperation({ summary: 'Revoke session and clear auth cookies' })
  async logout(
    @CurrentAdmin() admin: { sessionId: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(admin.sessionId, res);
    return null;
  }

  @SkipThrottle({ default: true })
  @Get('check')
  @ApiOperation({ summary: 'Validate access token and return admin profile' })
  async check(@CurrentAdmin() admin: { sub: string }) {
    return await this.auth.check(admin.sub);
  }

  @Public()
  @Throttle({ default: ADMIN_AUTH_THROTTLE.refresh })
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  async refresh(
    @Cookies('adminRefreshToken') refreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    await this.auth.refresh(refreshToken, res);
    return { ok: true };
  }

  @Public()
  @Throttle({ default: ADMIN_AUTH_THROTTLE.register })
  @Post('register')
  @ApiOperation({ summary: 'Start admin registration (sends OTP email)' })
  async register(@Body({ schema: adminRegisterBodySchema }) body: AdminRegisterBody) {
    return await this.auth.register(body);
  }

  @Public()
  @Throttle({ default: ADMIN_AUTH_THROTTLE.verifyRegistration })
  @Post('verify-registration')
  @ApiOperation({ summary: 'Verify OTP and create admin account (sets cookies)' })
  async verifyRegistration(
    @Body({ schema: adminVerifyRegistrationBodySchema })
    body: AdminVerifyRegistrationBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.auth.verifyRegistration(body.otp, res);
  }

  @Public()
  @Throttle({ default: ADMIN_AUTH_THROTTLE.resendRegistrationOtp })
  @Post('resend-registration-otp')
  @ApiOperation({ summary: 'Resend registration OTP (cooldown applies)' })
  async resendRegistrationOtp() {
    return await this.auth.resendRegistrationOtp();
  }

  @Public()
  @SkipThrottle({ default: true })
  @Get('registration-status')
  @ApiOperation({ summary: 'Pending registration OTP state for UI' })
  async registrationStatus() {
    return await this.auth.registrationStatus();
  }

  @Public()
  @Throttle({ default: ADMIN_AUTH_THROTTLE.forgotPassword })
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email (same response if email unknown)' })
  async forgotPassword(
    @Body({ schema: adminForgotPasswordBodySchema }) body: AdminForgotPasswordBody,
  ) {
    return await this.auth.forgotPassword(body.email);
  }

  @Public()
  @Throttle({ default: ADMIN_AUTH_THROTTLE.resetPassword })
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token from email link' })
  async resetPassword(
    @Body({ schema: adminResetPasswordBodySchema }) body: AdminResetPasswordBody,
  ) {
    return await this.auth.resetPassword(body.token, body.password);
  }

  @SkipThrottle({ default: true })
  @Post('change-password')
  @ApiOperation({ summary: 'Change password while signed in' })
  async changePassword(
    @CurrentAdmin() admin: { sub: string },
    @Body({ schema: adminChangePasswordBodySchema }) body: AdminChangePasswordBody,
  ) {
    return await this.auth.changePassword(admin.sub, body);
  }

  @SkipThrottle({ default: true })
  @Post('mfa/enroll')
  @ApiOperation({ summary: 'Start TOTP MFA enrollment (stub — AA6)' })
  async mfaEnroll() {
    return { message: 'MFA enrollment — implement TOTP in follow-up' };
  }
}
