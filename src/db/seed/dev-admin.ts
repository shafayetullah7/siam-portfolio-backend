/**
 * Local/dev only — do not run in production deploys.
 * Login credentials for manual testing and Playwright (see siam-frontend/e2e/admin-credentials.ts).
 */
import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { adminLocalAuth, admins } from '../schema/auth';

export const DEV_ADMIN_EMAIL = 'dev-admin@example.com';
export const DEV_ADMIN_PASSWORD = 'DevTestPassword1!';

const ARGON2_OPTS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function seedDevAdmin(db: NodePgDatabase): Promise<void> {
  const [existing] = await db
    .select({ email: adminLocalAuth.email })
    .from(adminLocalAuth)
    .where(eq(adminLocalAuth.email, DEV_ADMIN_EMAIL))
    .limit(1);

  if (existing) {
    console.log(`Dev admin already exists: ${DEV_ADMIN_EMAIL}`);
    return;
  }

  const passwordHash = await hash(DEV_ADMIN_PASSWORD, ARGON2_OPTS);

  const [admin] = await db
    .insert(admins)
    .values({
      firstName: 'Dev',
      lastName: 'Admin',
      userName: 'dev_admin',
    })
    .returning();

  await db.insert(adminLocalAuth).values({
    adminId: admin.id,
    email: DEV_ADMIN_EMAIL,
    password: passwordHash,
    verified: true,
  });

  console.log(`Seeded dev admin: ${DEV_ADMIN_EMAIL}`);
}
