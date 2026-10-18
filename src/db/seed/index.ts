import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { seedDevAdmin } from './dev-admin';

// Host `.env` uses localhost + DB_EXTERNAL_PORT; Docker Compose sets in-network URL.
// Never let mounted `.env` override an existing DATABASE_URL (e.g. postgres:5432).
config({ override: false });

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  // drizzle-orm rc: Pool must be passed via `{ client }`, not as a bare argument.
  const db = drizzle({ client: pool });

  try {
    await seedDevAdmin(db);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
