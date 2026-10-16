import { z } from 'zod';

export const ADMIN_PASSWORD_MIN = 8;
export const ADMIN_PASSWORD_MAX = 128;

/** Allowed special characters (includes `.`). Keep in sync with siam-frontend `adminPasswordPolicy.ts`. */
export const ADMIN_PASSWORD_SPECIAL_CHARS =
  '.!@#$%^&*()_+-=[]{}|;\'":,<>?/`~';

const SPECIAL_CLASS = ADMIN_PASSWORD_SPECIAL_CHARS.replace(
  /[-[\]\\/]/g,
  '\\$&',
);

const HAS_LETTER = /[A-Za-z]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL = new RegExp(`[${SPECIAL_CLASS}]`);
const ALLOWED_CHARS = new RegExp(`^[A-Za-z0-9${SPECIAL_CLASS}]+$`);

export type AdminPasswordCheckId =
  | 'length'
  | 'letter'
  | 'number'
  | 'special'
  | 'charset';

export type AdminPasswordCheck = {
  id: AdminPasswordCheckId;
  label: string;
  met: boolean;
};

export function getAdminPasswordChecks(password: string): AdminPasswordCheck[] {
  const len = password.length;
  const lengthOk =
    len >= ADMIN_PASSWORD_MIN && len <= ADMIN_PASSWORD_MAX;

  return [
    {
      id: 'length',
      label: `${ADMIN_PASSWORD_MIN}–${ADMIN_PASSWORD_MAX} characters`,
      met: lengthOk,
    },
    {
      id: 'letter',
      label: 'At least one letter',
      met: HAS_LETTER.test(password),
    },
    {
      id: 'number',
      label: 'At least one number',
      met: HAS_DIGIT.test(password),
    },
    {
      id: 'special',
      label: 'At least one special character (e.g. `.` `!` `@`)',
      met: HAS_SPECIAL.test(password),
    },
    {
      id: 'charset',
      label: 'Only letters, numbers, and allowed symbols',
      met: password.length === 0 || ALLOWED_CHARS.test(password),
    },
  ];
}

export function isAdminPasswordValid(password: string): boolean {
  return getAdminPasswordChecks(password).every((c) => c.met);
}

export const adminPasswordSchema = z
  .string()
  .min(ADMIN_PASSWORD_MIN, 'Password must be at least 8 characters')
  .max(ADMIN_PASSWORD_MAX, 'Password must be at most 128 characters')
  .superRefine((val, ctx) => {
    if (!isAdminPasswordValid(val)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Password does not meet requirements',
      });
    }
  });
