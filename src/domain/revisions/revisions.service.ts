import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { contentRevisions } from '../../db/schema/content-revisions';

@Injectable()
export class RevisionsService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) {}

  async append(
    entityType: string,
    entityId: string,
    snapshot: Record<string, unknown>,
  ) {
    const [row] = await this.db
      .insert(contentRevisions)
      .values({ entityType, entityId, snapshot })
      .returning();
    return row;
  }

  async list(entityType: string, entityId: string) {
    return this.db
      .select()
      .from(contentRevisions)
      .where(
        and(
          eq(contentRevisions.entityType, entityType),
          eq(contentRevisions.entityId, entityId),
        ),
      )
      .orderBy(desc(contentRevisions.createdAt));
  }

  async getById(id: string) {
    const [row] = await this.db
      .select()
      .from(contentRevisions)
      .where(eq(contentRevisions.id, id))
      .limit(1);
    return row ?? null;
  }
}
