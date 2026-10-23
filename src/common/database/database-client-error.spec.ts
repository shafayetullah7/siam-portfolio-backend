import { DrizzleQueryError } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import {
  DATABASE_SCHEMA_OUT_OF_DATE_MESSAGE,
  databaseClientErrorMessage,
} from './database-client-error';

describe('databaseClientErrorMessage', () => {
  it('returns null for unrelated errors', () => {
    expect(databaseClientErrorMessage(new Error('boom'))).toBeNull();
  });

  it('maps missing column to schema message', () => {
    const pg = Object.assign(new Error('column does not exist'), {
      code: '42703',
    });
    const err = new DrizzleQueryError('select 1', [], pg);
    expect(databaseClientErrorMessage(err)).toBe(
      DATABASE_SCHEMA_OUT_OF_DATE_MESSAGE,
    );
  });
});
