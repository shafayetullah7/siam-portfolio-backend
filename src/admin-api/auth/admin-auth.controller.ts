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
import type { Response } from 'express';
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
import { adminProfileSchema } from './dto/admin-profile.dto';
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
@UseGuards(AdminAuthGuard)
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
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

  @Post('logout')
  async logout(
    @CurrentAdmin() admin: { sessionId: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(admin.sessionId, res);
    return apiSuccess(null);
  }

  @Get('check')
  @SerializeOptions({ schema: adminProfileSchema })
  async check(@CurrentAdmin() admin: { sub: string }) {
    const profile = await this.auth.check(admin.sub);
    return apiSuccess(profile);
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Cookies('adminRefreshToken') refreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    await this.auth.refresh(refreshToken, res);
    return apiSuccess({ ok: true });
  }

  @Public()
  @Post('register')
  async register(@Body({ schema: adminRegisterBodySchema }) body: AdminRegisterBody) {
    const data = await this.auth.register(body);
    return apiSuccess(data);
  }

  @Public()
  @Post('verify-registration')
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
  @Get('registration-status')
  async registrationStatus() {
    return apiSuccess(await this.auth.registrationStatus());
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(
    @Body({ schema: adminForgotPasswordBodySchema }) body: AdminForgotPasswordBody,
  ) {
    return apiSuccess(await this.auth.forgotPassword(body.email));
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Body({ schema: adminResetPasswordBodySchema }) body: AdminResetPasswordBody,
  ) {
    return apiSuccess(
      await this.auth.resetPassword(body.token, body.password),
    );
  }

  @Post('change-password')
  async changePassword(
    @CurrentAdmin() admin: { sub: string },
    @Body({ schema: adminChangePasswordBodySchema }) body: AdminChangePasswordBody,
  ) {
    return apiSuccess(await this.auth.changePassword(admin.sub, body));
  }

  @Post('mfa/enroll')
  async mfaEnroll() {
    return apiSuccess({ message: 'MFA enrollment — implement TOTP in follow-up' });
  }
}
