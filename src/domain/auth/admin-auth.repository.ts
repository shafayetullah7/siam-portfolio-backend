import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { adminLocalAuth, admins } from '../../db/schema/auth';

export type AdminProfile = {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  mfaEnabled: boolean;
};

@Injectable()
export class AdminAuthRepository {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) {}

  toProfile(
    admin: typeof admins.$inferSelect,
    auth: typeof adminLocalAuth.$inferSelect,
  ): AdminProfile {
    return {
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      userName: admin.userName,
      email: auth.email,
      mfaEnabled: auth.mfaEnabled,
    };
  }

  async findByEmail(email: string) {
    const [row] = await this.db
      .select({
        admin: admins,
        auth: adminLocalAuth,
      })
      .from(adminLocalAuth)
      .innerJoin(admins, eq(admins.id, adminLocalAuth.adminId))
      .where(eq(adminLocalAuth.email, email))
      .limit(1);
    return row ?? null;
  }

  async findProfileByAdminId(adminId: string): Promise<AdminProfile | null> {
    const [admin] = await this.db
      .select()
      .from(admins)
      .where(eq(admins.id, adminId))
      .limit(1);
    if (!admin) return null;
    const [auth] = await this.db
      .select()
      .from(adminLocalAuth)
      .where(eq(adminLocalAuth.adminId, adminId))
      .limit(1);
    if (!auth) return null;
    return this.toProfile(admin, auth);
  }
}
