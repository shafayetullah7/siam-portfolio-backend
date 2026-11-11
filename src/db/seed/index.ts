import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { seedDevAdmin } from './dev-admin';
import { seedProjects } from './projects';
import { seedPublications } from './publications';
import { seedResearchThemes } from './research-themes';
import { seedContact } from './contact';
import { seedTimeline } from './timeline';
import { seedWriting } from './writing';
import { seedTalks } from './talks';
import { seedProfileHome } from './profile-home';

// Host `.env` uses localhost + DB_EXTERNAL_PORT; Docker Compose sets in-network URL.
// Project seed needs applied migrations for project child tables and PROJ11 junctions
// (`project_publications`, `project_section_media`). Writing seed needs WRIT11 junctions
// (`writing_article_*`). Timeline seed needs `timeline_entries` and
// `timeline_entry_media` (ACH1+). Contact seed needs MSG1 (`contact_messages`,
// site_settings contact columns). Talks seed needs M11 talks/collaborations/
// academic_service tables and `talks_hub_intro` on site_settings. Profile-home
// seed needs `profile` and `homepage` (portrait/hero media FKs optional). After schema
// changes: consent, then
// `pnpm db:generate` and `pnpm db:migrate` before `pnpm run db:seed`.
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
    if (process.env.NODE_ENV !== 'production') {
      await seedResearchThemes(db);
      await seedPublications(db);
      await seedProjects(db);
      await seedWriting(db);
      await seedTimeline(db);
      await seedContact(db);
      await seedTalks(db);
      await seedProfileHome(db);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
