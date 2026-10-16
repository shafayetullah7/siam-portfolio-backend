import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class CookieService {
  constructor(private readonly config: AppConfigService) {}

  setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string; xsrfToken: string },
  ) {
    const secure = !this.config.isDevelopment;
    const common = {
      secure,
      sameSite: secure ? ('none' as const) : ('lax' as const),
      domain: this.config.cookieDomain,
    };
    res.cookie('adminAccessToken', tokens.accessToken, {
      ...common,
      httpOnly: true,
      maxAge: this.config.sessionMaxAgeMs,
    });
    res.cookie('adminRefreshToken', tokens.refreshToken, {
      ...common,
      httpOnly: true,
      maxAge: this.config.sessionMaxAgeMs,
    });
    res.cookie('xsrf-token', tokens.xsrfToken, {
      ...common,
      httpOnly: false,
      maxAge: this.config.sessionMaxAgeMs,
    });
  }

  clearAuthCookies(res: Response) {
    const opts = { domain: this.config.cookieDomain };
    res.clearCookie('adminAccessToken', opts);
    res.clearCookie('adminRefreshToken', opts);
    res.clearCookie('xsrf-token', opts);
  }
}
