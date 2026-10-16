/** Portfolio-aligned limits — see siam-api/docs/admin-auth.md */

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;

export const ADMIN_AUTH_THROTTLE = {
  login: { limit: 5, ttl: 15 * MS_PER_MINUTE },
  refresh: { limit: 5, ttl: MS_PER_MINUTE },
  register: { limit: 3, ttl: MS_PER_HOUR },
  verifyRegistration: { limit: 5, ttl: 15 * MS_PER_MINUTE },
  resendRegistrationOtp: { limit: 3, ttl: 15 * MS_PER_MINUTE },
  forgotPassword: { limit: 5, ttl: 15 * MS_PER_MINUTE },
  resetPassword: { limit: 5, ttl: 15 * MS_PER_MINUTE },
} as const;

/** Module default when a route has no @Throttle override (high ceiling). */
export const ADMIN_AUTH_THROTTLE_MODULE_DEFAULT = {
  limit: 100,
  ttl: MS_PER_MINUTE,
} as const;
