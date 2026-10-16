import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { homepage, profile } from '../../db/schema/profile-home';

@Injectable()
export class ProfileHomeService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  private async getOrCreateProfile() {
    const [row] = await this.db.select().from(profile).limit(1);
    if (row) return row;
    const [created] = await this.db.insert(profile).values({}).returning();
    return created;
  }

  private async getOrCreateHomepage() {
    const [row] = await this.db.select().from(homepage).limit(1);
    if (row) return row;
    const [created] = await this.db.insert(homepage).values({}).returning();
    return created;
  }

  async getPublicAbout() {
    const p = await this.getOrCreateProfile();
    return {
      headline: p.headline,
      shortBio: p.shortBio,
      longBio: p.longBio,
      affiliation: p.affiliation,
    };
  }

  async getPublicHome() {
    const h = await this.getOrCreateHomepage();
    return {
      heroTitle: h.heroTitle,
      heroSubtitle: h.heroSubtitle,
    };
  }

  async updateProfile(input: Partial<typeof profile.$inferInsert>) {
    const current = await this.getOrCreateProfile();
    const [row] = await this.db
      .update(profile)
      .set(input)
      .where(eq(profile.id, current.id))
      .returning();
    return row;
  }

  async updateHomepage(input: Partial<typeof homepage.$inferInsert>) {
    const current = await this.getOrCreateHomepage();
    const [row] = await this.db
      .update(homepage)
      .set(input)
      .where(eq(homepage.id, current.id))
      .returning();
    return row;
  }
}
