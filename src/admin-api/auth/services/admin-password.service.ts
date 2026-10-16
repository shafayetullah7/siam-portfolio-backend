import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { randomBytes } from 'node:crypto';
import { eq, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { AppConfigService } from '../../../config/app-config.service';
import { AdminAuthRepository } from '../../../domain/auth/admin-auth.repository';
import { EmailService } from '../../../domain/auth/email.service';
import {
  adminLocalAuth,
  passwordResetTokens,
} from '../../../db/schema/auth';
import { HashingService } from '../../../libs/hashing/hashing.service';

@Injectable()
export class AdminPasswordService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
    private readonly repo: AdminAuthRepository,
    private readonly hashing: HashingService,
    private readonly config: AppConfigService,
    private readonly email: EmailService,
  ) {}

  async forgotPassword(email: string) {
    const found = await this.repo.findByEmail(email);
    if (found) {
      const token = randomBytes(32).toString('hex');
      const tokenHash = await this.hashing.hashPassword(token);
      await this.db.insert(passwordResetTokens).values({
        adminId: found.admin.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 3_600_000),
      });
      const link = `${this.config.frontendUrl}/admin/reset-password?token=${token}`;
      await this.email.sendPasswordResetLink(found.auth.email, link);
    }
    return {
      message:
        'If an account exists for that email, password reset instructions were sent.',
    };
  }

  async resetPassword(token: string, password: string) {
    const rows = await this.db
      .select()
      .from(passwordResetTokens)
      .where(isNull(passwordResetTokens.usedAt));
    let match: (typeof rows)[0] | null = null;
    for (const row of rows) {
      if (await this.hashing.verifyPassword(token, row.tokenHash)) {
        match = row;
        break;
      }
    }
    if (!match || match.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }
    const hash = await this.hashing.hashPassword(password);
    await this.db
      .update(adminLocalAuth)
      .set({ password: hash })
      .where(eq(adminLocalAuth.adminId, match.adminId));
    await this.db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, match.id));
    return { message: 'Password updated' };
  }

  async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const [auth] = await this.db
      .select()
      .from(adminLocalAuth)
      .where(eq(adminLocalAuth.adminId, adminId))
      .limit(1);
    if (!auth) throw new UnauthorizedException();
    const valid = await this.hashing.verifyPassword(
      currentPassword,
      auth.password,
    );
    if (!valid) throw new BadRequestException('Invalid current password');
    const hash = await this.hashing.hashPassword(newPassword);
    await this.db
      .update(adminLocalAuth)
      .set({ password: hash })
      .where(eq(adminLocalAuth.adminId, adminId));
    return { message: 'Password updated' };
  }
}
