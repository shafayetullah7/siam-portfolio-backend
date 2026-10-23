import { DrizzleQueryError } from 'drizzle-orm';

export const DATABASE_SCHEMA_OUT_OF_DATE_MESSAGE =
  'Database schema is out of date. Run migrations (pnpm db:migrate or pnpm db:migrate:docker).';

/** Postgres codes: undefined_column, undefined_table */
const SCHEMA_DRIFT_CODES = new Set(['42703', '42P01']);

function postgresErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function unwrapQueryCause(exception: unknown): unknown {
  if (exception instanceof DrizzleQueryError) {
    return exception.cause ?? exception;
  }
  return exception;
}

/**
 * When the DB is behind Drizzle schema (missing column/table), return a client-safe message.
 * Empty tables are not errors — only invalid SQL against the live schema.
 */
export function databaseClientErrorMessage(exception: unknown): string | null {
  const root = unwrapQueryCause(exception);
  const code = postgresErrorCode(root);
  if (code && SCHEMA_DRIFT_CODES.has(code)) {
    return DATABASE_SCHEMA_OUT_OF_DATE_MESSAGE;
  }
  return null;
}
