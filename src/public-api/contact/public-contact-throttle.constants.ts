const MS_PER_MINUTE = 60_000;

/** Public contact form POST — per IP (MSG3). */
export const PUBLIC_CONTACT_THROTTLE = {
  submit: { limit: 5, ttl: 15 * MS_PER_MINUTE },
} as const;

export const PUBLIC_CONTACT_THROTTLE_MODULE_DEFAULT = {
  limit: 100,
  ttl: MS_PER_MINUTE,
} as const;
