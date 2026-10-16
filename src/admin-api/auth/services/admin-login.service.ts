import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminAuthRepository } from '../../../domain/auth/admin-auth.repository';
import { HashingService } from '../../../libs/hashing/hashing.service';
import { AdminSessionService } from './admin-session.service';

@Injectable()
export class AdminLoginService {
  constructor(
    private readonly repo: AdminAuthRepository,
    private readonly hashing: HashingService,
    private readonly sessions: AdminSessionService,
  ) {}

  async login(
    email: string,
    password: string,
    res: Response,
    meta: { userAgent?: string; ip?: string },
  ) {
    const found = await this.repo.findByEmail(email);
    if (!found) throw new NotFoundException('Admin not found');
    const valid = await this.hashing.verifyPassword(
      password,
      found.auth.password,
    );
    if (!valid) throw new BadRequestException('Invalid password');
    const session = await this.sessions.createSession(
      found.admin.id,
      meta.userAgent,
      meta.ip,
    );
    this.sessions.setAuthCookies(res, found.admin.id, session.id);
    return this.repo.toProfile(found.admin, found.auth);
  }
}
