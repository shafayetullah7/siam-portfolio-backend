import {
  Body,
  Controller,
  Cookies,
  Get,
  Headers,
  Ip,
  Post,
  Res,
  SerializeOptions,
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
import { apiSuccess } from '../../common/http/api-response';
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
  adminMessageSchema,
  adminOkSchema,
} from './dto/admin-message.dto';
import { adminProfileSchema } from './dto/admin-profile.dto';
import {
  adminRegisterBodySchema,
  type AdminRegisterBody,
} from './dto/admin-register.dto';
import { adminRegisterResultSchema } from './dto/admin-register-result.dto';
import { adminRegistrationStatusSchema } from './dto/admin-registration-status.dto';
import { adminResendRegistrationOtpResultSchema } from './dto/admin-resend-registration-otp-result.dto';
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
  @SerializeOptions({ schema: adminProfileSchema })
  async login(
    @Body({ schema: adminLoginBodySchema }) body: AdminLoginBody,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const admin = await this.auth.login(body, res, {
      userAgent,
      ip,
    });
    return apiSuccess(admin);
  }

  @SkipThrottle({ default: true })
  @Post('logout')
  @ApiOperation({ summary: 'Revoke session and clear auth cookies' })
  async logout(
    @CurrentAdmin() admin: { sessionId: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(admin.sessionId, res);
    return apiSuccess(null);
  }

  @SkipThrottle({ default: true })
  @Get('check')
  @ApiOperation({ summary: 'Validate access token and return admin profile' })
  @SerializeOptions({ schema: adminProfileSchema })
  async check(@CurrentAdmin() admin: { sub: string }) {
    const profile = await this.auth.check(admin.sub);
    return apiSuccess(profile);
  }

  @Public()
  @Throttle({ default: ADMIN_AUTH_THROTTLE.refresh })
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  @SerializeOptions({ schema: adminOkSchema })
  async refresh(
    @Cookies('adminRefreshToken') refreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    await this.auth.refresh(refreshToken, res);
    return apiSuccess({ ok: true });
  }

  @Public()
  @Throttle({ default: ADMIN_AUTH_THROTTLE.register })
  @Post('register')
  @ApiOperation({ summary: 'Start admin registration (sends OTP email)' })
  @SerializeOptions({ schema: adminRegisterResultSchema })
  async register(@Body({ schema: adminRegisterBodySchema }) body: AdminRegisterBody) {
    const data = await this.auth.register(body);
    return apiSuccess(data);
  }

  @Public()
  @Throttle({ default: ADMIN_AUTH_THROTTLE.verifyRegistration })
  @Post('verify-registration')
  @ApiOperation({ summary: 'Verify OTP and create admin account (sets cookies)' })
  @SerializeOptions({ schema: adminProfileSchema })
  async verifyRegistration(
    @Body({ schema: adminVerifyRegistrationBodySchema })
    body: AdminVerifyRegistrationBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const admin = await this.auth.verifyRegistration(body.otp, res);
    return apiSuccess(admin);
  }

  @Public()
  @Throttle({ default: ADMIN_AUTH_THROTTLE.resendRegistrationOtp })
  @Post('resend-registration-otp')
  @ApiOperation({ summary: 'Resend registration OTP (cooldown applies)' })
  @SerializeOptions({ schema: adminResendRegistrationOtpResultSchema })
  async resendRegistrationOtp() {
    return apiSuccess(await this.auth.resendRegistrationOtp());
  }

  @Public()
  @SkipThrottle({ default: true })
  @Get('registration-status')
  @ApiOperation({ summary: 'Pending registration OTP state for UI' })
  @SerializeOptions({ schema: adminRegistrationStatusSchema })
  async registrationStatus() {
    return apiSuccess(await this.auth.registrationStatus());
  }

  @Public()
  @Throttle({ default: ADMIN_AUTH_THROTTLE.forgotPassword })
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email (same response if email unknown)' })
  @SerializeOptions({ schema: adminMessageSchema })
  async forgotPassword(
    @Body({ schema: adminForgotPasswordBodySchema }) body: AdminForgotPasswordBody,
  ) {
    return apiSuccess(await this.auth.forgotPassword(body.email));
  }

  @Public()
  @Throttle({ default: ADMIN_AUTH_THROTTLE.resetPassword })
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token from email link' })
  @SerializeOptions({ schema: adminMessageSchema })
  async resetPassword(
    @Body({ schema: adminResetPasswordBodySchema }) body: AdminResetPasswordBody,
  ) {
    return apiSuccess(
      await this.auth.resetPassword(body.token, body.password),
    );
  }

  @SkipThrottle({ default: true })
  @Post('change-password')
  @ApiOperation({ summary: 'Change password while signed in' })
  @SerializeOptions({ schema: adminMessageSchema })
  async changePassword(
    @CurrentAdmin() admin: { sub: string },
    @Body({ schema: adminChangePasswordBodySchema }) body: AdminChangePasswordBody,
  ) {
    return apiSuccess(await this.auth.changePassword(admin.sub, body));
  }

  @SkipThrottle({ default: true })
  @Post('mfa/enroll')
  @ApiOperation({ summary: 'Start TOTP MFA enrollment (stub — AA6)' })
  @SerializeOptions({ schema: adminMessageSchema })
  async mfaEnroll() {
    return apiSuccess({ message: 'MFA enrollment — implement TOTP in follow-up' });
  }
}
