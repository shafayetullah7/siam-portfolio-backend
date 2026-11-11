export function normalizeTalkSlug(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed) {
    throw new Error('Slug is required');
  }
  return trimmed;
}
