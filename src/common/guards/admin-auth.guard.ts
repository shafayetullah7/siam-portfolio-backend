import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AppConfigService } from '../../config/app-config.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AdminPayload } from '../decorators/current-admin.decorator';
import { sessions } from '../../db/schema/auth';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
    @InjectDrizzle() private readonly db: NodePgDatabase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();

    if (MUTATING.has(req.method)) {
      const header = req.header('x-xsrf-token');
      const cookie = req.cookies?.['xsrf-token'];
      if (!header || !cookie || header !== cookie) {
        throw new UnauthorizedException('CSRF validation failed');
      }
    }

    const access = req.cookies?.adminAccessToken as string | undefined;
    if (!access) throw new UnauthorizedException();

    try {
      const payload = this.jwt.verify<AdminPayload>(access, {
        secret: this.config.jwtAdminAccessSecret,
      });
      const [session] = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.id, payload.sessionId))
        .limit(1);
      if (!session || session.revoked || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session invalid');
      }
      (req as Request & { admin: AdminPayload }).admin = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
