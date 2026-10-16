import { describe, expect, it } from 'vitest';
import {
  adminPasswordSchema,
  getAdminPasswordChecks,
  isAdminPasswordValid,
} from './admin-password-policy';

const VALID = 'Testpass1.';

describe('admin-password-policy', () => {
  it('accepts a compliant password', () => {
    expect(isAdminPasswordValid(VALID)).toBe(true);
    expect(adminPasswordSchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects password12 (no special)', () => {
    expect(isAdminPasswordValid('password12')).toBe(false);
    expect(adminPasswordSchema.safeParse('password12').success).toBe(false);
  });

  it('rejects too short', () => {
    expect(isAdminPasswordValid('Ab1.')).toBe(false);
  });

  it('rejects too long', () => {
    const long = `A1.${'a'.repeat(126)}`;
    expect(long.length).toBe(129);
    expect(isAdminPasswordValid(long)).toBe(false);
  });

  it('rejects spaces', () => {
    expect(isAdminPasswordValid('Test pass1.')).toBe(false);
    const charset = getAdminPasswordChecks('Test pass1.').find(
      (c) => c.id === 'charset',
    );
    expect(charset?.met).toBe(false);
  });

  it('requires a letter', () => {
    expect(isAdminPasswordValid('1234567!')).toBe(false);
  });

  it('requires a number', () => {
    expect(isAdminPasswordValid('Testpass!')).toBe(false);
  });

  it('accepts exactly 8 characters when rules met', () => {
    expect(isAdminPasswordValid('Test1.aa')).toBe(true);
  });
});
