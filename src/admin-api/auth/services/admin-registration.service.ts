import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Response } from 'express';
import { AppConfigService } from '../../../config/app-config.service';
import {
  AdminAuthRepository,
} from '../../../domain/auth/admin-auth.repository';
import { EmailService } from '../../../domain/auth/email.service';
import {
  adminLocalAuth,
  admins,
  pendingAdmins,
} from '../../../db/schema/auth';
import { HashingService } from '../../../libs/hashing/hashing.service';
import type { AdminRegisterBody } from '../dto/admin-register.dto';
import { AdminSessionService } from './admin-session.service';

@Injectable()
export class AdminRegistrationService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
    private readonly repo: AdminAuthRepository,
    private readonly hashing: HashingService,
    private readonly config: AppConfigService,
    private readonly email: EmailService,
    private readonly sessions: AdminSessionService,
  ) {}

  async register(input: AdminRegisterBody) {
    if (!this.config.adminRegistrationEnabled) {
      throw new ForbiddenException('Registration disabled');
    }
    const existing = await this.repo.findByEmail(input.email);
    if (existing) throw new ConflictException('Email already registered');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await this.hashing.hashOtp(otp);
    const passwordHash = await this.hashing.hashPassword(input.password);
    await this.db.delete(pendingAdmins);
    const expiresAt = new Date(
      Date.now() + this.config.otpExpiryMinutes * 60_000,
    );
    const [pending] = await this.db
      .insert(pendingAdmins)
      .values({
        ...input,
        password: passwordHash,
        otpHash,
        otpExpiresAt: expiresAt,
        otpSentAt: new Date(),
      })
      .returning();
    await this.email.sendAdminRegistrationOtp(
      this.config.adminOtpRecipientEmail,
      otp,
    );
    return { pendingId: pending.id, otpExpiresAt: expiresAt.toISOString() };
  }

  async verifyRegistration(otp: string, res: Response) {
    const [pending] = await this.db
      .select()
      .from(pendingAdmins)
      .orderBy(desc(pendingAdmins.createdAt))
      .limit(1);
    if (!pending) throw new BadRequestException('No pending registration');
    if (pending.otpAttempts >= this.config.otpMaxAttempts) {
      throw new ForbiddenException('OTP attempts exceeded');
    }
    if (pending.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }
    const valid = await this.hashing.verifyOtp(otp, pending.otpHash);
    if (!valid) {
      await this.db
        .update(pendingAdmins)
        .set({ otpAttempts: pending.otpAttempts + 1 })
        .where(eq(pendingAdmins.id, pending.id));
      throw new BadRequestException('Invalid OTP');
    }
    const [admin] = await this.db
      .insert(admins)
      .values({
        firstName: pending.firstName,
        lastName: pending.lastName,
        userName: pending.userName,
      })
      .returning();
    const [auth] = await this.db
      .insert(adminLocalAuth)
      .values({
        adminId: admin.id,
        email: pending.email,
        password: pending.password,
        verified: true,
      })
      .returning();
    await this.db.delete(pendingAdmins);
    const session = await this.sessions.createSession(admin.id);
    this.sessions.setAuthCookies(res, admin.id, session.id);
    return this.repo.toProfile(admin, auth);
  }

  async registrationStatus() {
    const [pending] = await this.db
      .select()
      .from(pendingAdmins)
      .orderBy(desc(pendingAdmins.createdAt))
      .limit(1);
    if (!pending) return { hasPending: false };
    return {
      hasPending: true,
      otpExpiresAt: pending.otpExpiresAt.toISOString(),
      locked: pending.otpAttempts >= this.config.otpMaxAttempts,
    };
  }
}
