/** Parse `kinds` from query strings (comma-separated or repeated params). */
export function coerceKindsArray(val: unknown): string[] | undefined {
  if (val === undefined || val === null || val === '') {
    return undefined;
  }
  const parts = Array.isArray(val)
    ? val.flatMap((item) => String(item).split(','))
    : String(val).split(',');
  const kinds = parts.map((s) => s.trim()).filter(Boolean);
  return kinds.length > 0 ? kinds : undefined;
}
