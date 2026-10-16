import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDrizzle } from '@nestjs/drizzle';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Response } from 'express';
import { AppConfigService } from '../../../config/app-config.service';
import { adminSessions, sessions } from '../../../db/schema/auth';
import { CookieService } from '../../../libs/cookie/cookie.service';

@Injectable()
export class AdminSessionService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
    private readonly jwt: JwtService,
    private readonly cookies: CookieService,
    private readonly config: AppConfigService,
  ) {}

  async createSession(adminId: string, userAgent?: string, ip?: string) {
    const expiresAt = new Date(Date.now() + this.config.sessionMaxAgeMs);
    const [session] = await this.db
      .insert(sessions)
      .values({ userAgent, ip, expiresAt })
      .returning();
    await this.db.insert(adminSessions).values({
      adminId,
      sessionId: session.id,
    });
    return session;
  }

  signTokens(adminId: string, sessionId: string) {
    const payload = { sub: adminId, sessionId, role: 'admin' as const };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.jwtAdminAccessSecret,
      expiresIn: this.config.jwtAdminAccessExp as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.jwtAdminRefreshSecret,
      expiresIn: this.config.jwtAdminRefreshExp as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
    const xsrfToken = randomBytes(32).toString('hex');
    return { accessToken, refreshToken, xsrfToken };
  }

  setAuthCookies(res: Response, adminId: string, sessionId: string) {
    const tokens = this.signTokens(adminId, sessionId);
    this.cookies.setAuthCookies(res, tokens);
  }

  async refresh(refreshToken: string, res: Response) {
    try {
      const payload = this.jwt.verify<{ sub: string; sessionId: string }>(
        refreshToken,
        { secret: this.config.jwtAdminRefreshSecret },
      );
      const [session] = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.id, payload.sessionId))
        .limit(1);
      if (!session || session.revoked) {
        throw new UnauthorizedException();
      }
      this.setAuthCookies(res, payload.sub, payload.sessionId);
      return { ok: true };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(sessionId: string, res: Response) {
    await this.db
      .update(sessions)
      .set({ revoked: true, logoutAt: new Date() })
      .where(eq(sessions.id, sessionId));
    this.cookies.clearAuthCookies(res);
  }
}
