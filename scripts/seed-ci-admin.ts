/**
 * Idempotent CI/local e2e admin — run after db:migrate.
 * Env: DATABASE_URL (required), CI_ADMIN_EMAIL, CI_ADMIN_PASSWORD (optional).
 */
import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { adminLocalAuth, admins } from "../src/db/schema/auth";

const DEFAULT_EMAIL = "ci-admin@example.com";
const DEFAULT_PASSWORD = "CiTestPassword1!";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const email = process.env.CI_ADMIN_EMAIL ?? DEFAULT_EMAIL;
  const password = process.env.CI_ADMIN_PASSWORD ?? DEFAULT_PASSWORD;

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  const [existing] = await db
    .select({ email: adminLocalAuth.email })
    .from(adminLocalAuth)
    .where(eq(adminLocalAuth.email, email))
    .limit(1);

  if (existing) {
    console.log(`CI admin already exists: ${email}`);
    await pool.end();
    return;
  }

  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const [admin] = await db
    .insert(admins)
    .values({
      firstName: "CI",
      lastName: "Admin",
      userName: "ci_admin",
    })
    .returning();

  await db.insert(adminLocalAuth).values({
    adminId: admin.id,
    email,
    password: passwordHash,
    verified: true,
  });

  console.log(`Seeded CI admin: ${email}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
