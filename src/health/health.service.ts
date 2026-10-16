import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
@Injectable()
export class HealthService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) {}

  async check(): Promise<{ status: 'ok'; database: 'up' | 'down' }> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return { status: 'ok', database: 'up' };
    } catch {
      return { status: 'ok', database: 'down' };
    }
  }
}
