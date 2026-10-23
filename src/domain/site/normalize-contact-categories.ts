const MAX_CONTACT_CATEGORIES = 20;

/** Trim, drop empties, dedupe preserving first occurrence. */
export function normalizeContactCategories(categories: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of categories) {
    const trimmed = raw.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
    if (result.length >= MAX_CONTACT_CATEGORIES) break;
  }
  return result;
}

export { MAX_CONTACT_CATEGORIES };
